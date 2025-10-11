import { supabase } from "@/lib/supabase";
import type {
	CancellationFormData,
	DeliveryAddress,
	DeliveryAddressFormData,
	Order,
	OrderFilters,
	OrderFinancials,
	OrderFormData,
	OrderWithRelations,
	PaymentFormData,
	ReferralPartner,
	ReferralPartnerFormData,
	Supplier,
	SupplierFormData,
} from "@/types/order";

export const ordersApi = {
	/**
	 * Get all orders with relationships and optional filters
	 */
	async getOrders(filters?: OrderFilters): Promise<OrderWithRelations[]> {
		let query = supabase.from("orders").select(`
        *,
        customer:customers(id, name, phone),
        referral_partner:referral_partners(id, name, commission_type, commission_value),
        delivery_address:delivery_addresses(*),
        order_items(
          *,
          product:products(id, name, unit_of_measure)
        ),
        order_payments(*),
        order_cancellations(*)
      `);

		// Apply filters
		if (filters?.status && filters.status.length > 0) {
			query = query.in("status", filters.status);
		}

		if (filters?.customer_id) {
			query = query.eq("customer_id", filters.customer_id);
		}

		if (filters?.referral_partner_id) {
			query = query.eq("referral_partner_id", filters.referral_partner_id);
		}

		if (filters?.date_from) {
			query = query.gte("created_at", filters.date_from);
		}

		if (filters?.date_to) {
			query = query.lte("created_at", filters.date_to);
		}

		if (filters?.needs_delivery !== undefined) {
			if (filters.needs_delivery) {
				query = query.not("delivery_address_id", "is", null);
			} else {
				query = query.is("delivery_address_id", null);
			}
		}

		// Search by customer name or display_id
		if (filters?.search_query) {
			// This requires a more complex query - we'll do client-side filtering for now
			// or you can create a Postgres function for full-text search
		}

		query = query.order("created_at", { ascending: false });

		const { data, error } = await query;
		if (error) throw error;

		// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
		// @ts-ignore
		return data as OrderWithRelations[];
	},

	/**
	 * Get single order by ID with all relationships
	 */
	async getOrderById(id: string): Promise<OrderWithRelations | null> {
		const { data, error } = await supabase
			.from("orders")
			.select(`
        *,
        customer:customers(id, name, phone),
        referral_partner:referral_partners(id, name, commission_type, commission_value),
        delivery_address:delivery_addresses(*),
        order_items(
          *,
          product:products(id, name, unit_of_measure)
        ),
        order_payments(*),
        order_cancellations(*)
      `)
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") return null;
			throw error;
		}

		// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
		// @ts-ignore
		return data as OrderWithRelations;
	},

	/**
	 * Create a new order with items
	 */
	async createOrder(formData: OrderFormData): Promise<Order> {
		// 1. Calculate totals
		const itemsData = await Promise.all(
			formData.items.map(async (item) => {
				const { data: product } = await supabase
					.from("products")
					.select("sell_price, id")
					.eq("id", item.product_id)
					.single();

				const { data: costPrice } = await supabase
					.from("product_price_history")
					.select("cost_price")
					.eq("product_id", item.product_id)
					.order("effective_from_date", { ascending: false })
					.limit(1)
					.single();

				return {
					product_id: item.product_id,
					quantity: item.quantity,
					supplier_id: item.supplier_id || null,
					price_at_time: product?.sell_price || 0,
					cost_price_at_time: costPrice?.cost_price || 0,
				};
			}),
		);

		const subtotal = itemsData.reduce(
			(sum, item) => sum + item.price_at_time * item.quantity,
			0,
		);
		const total_amount =
			subtotal - formData.discount_amount + formData.delivery_fee;

		// 2. Create order
		const { data: order, error: orderError } = await supabase
			.from("orders")
			.insert({
				customer_id: formData.customer_id,
				referral_partner_id: formData.referral_partner_id || null,
				delivery_address_id: formData.delivery_address_id || null,
				status: "pending",
				total_amount,
				discount_amount: formData.discount_amount,
				delivery_fee: formData.delivery_fee,
				due_date: formData.due_date,
				notes: formData.notes || null,
			})
			.select()
			.single();

		if (orderError) throw orderError;

		// 3. Create order items
		const orderItemsToInsert = itemsData.map((item) => ({
			order_id: order.id,
			...item,
		}));

		const { error: itemsError } = await supabase
			.from("order_items")
			.insert(orderItemsToInsert);

		if (itemsError) {
			// Rollback order creation
			await supabase.from("orders").delete().eq("id", order.id);
			throw itemsError;
		}

		// 4. Update product stock (deduct ordered quantities)
		for (const item of formData.items) {
			const { error: stockError } = await supabase.rpc("decrement_stock", {
				product_id: item.product_id,
				quantity: item.quantity,
			});
			// Note: This requires a Postgres function - see below
			if (stockError) console.error("Stock update failed:", stockError);
		}

		return order;
	},

	/**
	 * Update an existing order
	 */
	async updateOrder(id: string, formData: OrderFormData): Promise<Order> {
		// Get current order to check if editable
		const { data: currentOrder } = await supabase
			.from("orders")
			.select("status, due_date")
			.eq("id", id)
			.single();

		if (!currentOrder) throw new Error("Order not found");
		if (currentOrder.status === "completed")
			throw new Error("Cannot edit completed orders");

		// const today = new Date().toISOString().split("T")[0];
		// if (currentOrder.due_date === today)
		// 	throw new Error("Cannot edit orders on their due date");

		// Delete existing order items
		await supabase.from("order_items").delete().eq("order_id", id);

		// Re-create with new items (similar to create logic)
		const itemsData = await Promise.all(
			formData.items.map(async (item) => {
				const { data: product } = await supabase
					.from("products")
					.select("sell_price")
					.eq("id", item.product_id)
					.single();

				const { data: costPrice } = await supabase
					.from("product_price_history")
					.select("cost_price")
					.eq("product_id", item.product_id)
					.order("effective_from_date", { ascending: false })
					.limit(1)
					.single();

				return {
					order_id: id,
					product_id: item.product_id,
					quantity: item.quantity,
					supplier_id: item.supplier_id || null,
					price_at_time: product?.sell_price || 0,
					cost_price_at_time: costPrice?.cost_price || 0,
				};
			}),
		);

		const subtotal = itemsData.reduce(
			(sum, item) => sum + item.price_at_time * item.quantity,
			0,
		);
		const total_amount =
			subtotal - formData.discount_amount + formData.delivery_fee;

		// Update order
		const { data: updatedOrder, error: updateError } = await supabase
			.from("orders")
			.update({
				delivery_address_id: formData.delivery_address_id || null,
				total_amount,
				discount_amount: formData.discount_amount,
				delivery_fee: formData.delivery_fee,
				due_date: formData.due_date,
				notes: formData.notes || null,
			})
			.eq("id", id)
			.select()
			.single();

		if (updateError) throw updateError;

		// Insert new order items
		const { error: itemsError } = await supabase
			.from("order_items")
			.insert(itemsData);

		if (itemsError) throw itemsError;

		return updatedOrder;
	},

	/**
	 * Cancel an order and restore stock
	 */
	async cancelOrder(data: CancellationFormData): Promise<void> {
		const { order_id, reason, notes } = data;

		// Get order items to restore stock
		const { data: orderItems } = await supabase
			.from("order_items")
			.select("product_id, quantity")
			.eq("order_id", order_id);

		// Update order status
		const { error: statusError } = await supabase
			.from("orders")
			.update({ status: "cancelled" })
			.eq("id", order_id);

		if (statusError) throw statusError;

		// Create cancellation record
		const { error: cancelError } = await supabase
			.from("order_cancellations")
			.insert({
				order_id,
				reason,
				notes: notes || null,
			});

		if (cancelError) throw cancelError;

		// Restore stock
		if (orderItems) {
			for (const item of orderItems) {
				await supabase.rpc("increment_stock", {
					product_id: item.product_id,
					quantity: item.quantity,
				});
			}
		}
	},

	/**
	 * Log a payment for an order
	 */
	async logPayment(data: PaymentFormData): Promise<void> {
		const { order_id, amount } = data;

		// Get order total and existing payments
		const { data: order } = await supabase
			.from("orders")
			.select("total_amount")
			.eq("id", order_id)
			.single();

		const { data: payments } = await supabase
			.from("order_payments")
			.select("amount")
			.eq("order_id", order_id);

		const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0);
		const newTotal = totalPaid + amount;

		if (order && newTotal > order.total_amount) {
			throw new Error("Payment exceeds order total");
		}

		// Insert payment
		const { error: paymentError } = await supabase
			.from("order_payments")
			.insert({
				order_id: data.order_id,
				amount: data.amount,
				method: data.method,
				payment_date: data.payment_date,
				ref_number: data.ref_number || null,
				notes: data.notes || null,
			});

		if (paymentError) throw paymentError;

		// Auto-complete if fully paid and ready for pickup
		if (order && newTotal >= order.total_amount) {
			const { data: orderStatus } = await supabase
				.from("orders")
				.select("status")
				.eq("id", order_id)
				.single();

			if (orderStatus?.status === "ready_for_pickup") {
				await supabase
					.from("orders")
					.update({ status: "completed" })
					.eq("id", order_id);
			}
		}
	},

	/**
	 * Calculate order financials
	 */
	async calculateFinancials(orderId: string): Promise<OrderFinancials> {
		const { data: order } = await supabase
			.from("orders")
			.select(`
        *,
        order_items(*),
        order_payments(*),
        referral_partner:referral_partners(commission_type, commission_value)
      `)
			.eq("id", orderId)
			.single();

		if (!order) throw new Error("Order not found");

		// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
		// @ts-ignore
		const items = order.order_items;
		const subtotal = items.reduce(
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore
			(sum, item) => sum + item.price_at_time * item.quantity,
			0,
		);
		const cost_price_total = items.reduce(
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore
			(sum, item) => sum + item.cost_price_at_time * item.quantity,
			0,
		);

		// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
		// @ts-ignore
		const total_paid = order.order_payments.reduce(
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore
			(sum, p) => sum + p.amount,
			0,
		);

		let referral_commission = 0;
		// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
		// @ts-ignore
		if (order.referral_partner) {
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore
			if (order.referral_partner.commission_type === "percent") {
				referral_commission =
					// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
					// @ts-ignore
					(order.total_amount * order.referral_partner.commission_value) / 100;
			} else {
				// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
				// @ts-ignore
				referral_commission = order.referral_partner.commission_value;
			}
		}

		const profit = order.total_amount - cost_price_total - referral_commission;

		return {
			subtotal,
			discount_amount: order.discount_amount,
			delivery_fee: order.delivery_fee,
			total_amount: order.total_amount,
			total_paid,
			balance_due: order.total_amount - total_paid,
			referral_commission,
			cost_price_total,
			profit,
		};
	},
};

/**
 * Delivery Addresses API
 */
export const deliveryAddressesApi = {
	async getCustomerAddresses(customerId: string): Promise<DeliveryAddress[]> {
		const { data, error } = await supabase
			.from("delivery_addresses")
			.select("*")
			.eq("customer_id", customerId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	async createAddress(
		customerId: string,
		addressData: DeliveryAddressFormData,
	): Promise<DeliveryAddress> {
		const { data, error } = await supabase
			.from("delivery_addresses")
			.insert({
				customer_id: customerId,
				...addressData,
			})
			.select()
			.single();

		if (error) throw error;
		return data;
	},
};

/**
 * Referral Partners API
 */
export const referralPartnersApi = {
	async getReferralPartners(): Promise<ReferralPartner[]> {
		const { data, error } = await supabase
			.from("referral_partners")
			.select("*")
			.eq("is_active", true)
			.order("name");

		if (error) throw error;
		return data;
	},

	async createReferralPartner(
		partnerData: ReferralPartnerFormData,
	): Promise<ReferralPartner> {
		const { data, error } = await supabase
			.from("referral_partners")
			.insert(partnerData)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async updateReferralPartner(
		id: string,
		partnerData: ReferralPartnerFormData,
	): Promise<ReferralPartner> {
		const { data, error } = await supabase
			.from("referral_partners")
			.update(partnerData)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},
};

/**
 * Suppliers API
 */
export const suppliersApi = {
	async getSuppliers(): Promise<Supplier[]> {
		const { data, error } = await supabase
			.from("suppliers")
			.select("*")
			.eq("is_active", true)
			.order("name");

		if (error) throw error;
		return data;
	},

	async createSupplier(supplierData: SupplierFormData): Promise<Supplier> {
		const { data, error } = await supabase
			.from("suppliers")
			.insert(supplierData)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async updateSupplier(
		id: string,
		supplierData: SupplierFormData,
	): Promise<Supplier> {
		const { data, error } = await supabase
			.from("suppliers")
			.update(supplierData)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},
};

/**
 * Utility functions
 */
export const orderUtils = {
	formatCurrency(amount: number): string {
		const formatted = amount.toFixed(2);
		// Remove decimals if it's a whole number
		return amount % 1 === 0 ? `₹${Math.floor(amount)}` : `₹${formatted}`;
	},

	formatDisplayId(displayId: string): string {
		return displayId; // Already formatted as OID2025001
	},

	getStatusColor(status: string): { bg: string; text: string; border: string } {
		const colors = {
			pending: {
				bg: "bg-orange-50",
				text: "text-orange-600",
				border: "border-orange-200",
			},
			ready_for_pickup: {
				bg: "bg-yellow-50",
				text: "text-yellow-600",
				border: "border-yellow-200",
			},
			completed: {
				bg: "bg-green-50",
				text: "text-green-600",
				border: "border-green-200",
			},
			cancelled: {
				bg: "bg-gray-50",
				text: "text-gray-600",
				border: "border-gray-200",
			},
		};
		return colors[status as keyof typeof colors] || colors.pending;
	},
};
