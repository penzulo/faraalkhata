export interface Supplier {
	id: string;
	name: string;
	phone: string | null;
	email: string | null;
	is_active: boolean;
	created_at: string;
}

export interface ReferralPartner {
	id: string;
	name: string;
	phone: string | null;
	commission_type: "percent" | "fixed";
	commission_value: number;
	notes: string | null;
	is_active: boolean;
	created_at: string;
}

export interface DeliveryAddress {
	id: string;
	customer_id: string;
	address_line1: string;
	address_line2: string | null;
	city: string | null;
	state: string | null;
	pincode: string | null;
	recipient_name: string;
	phone: string;
	created_at: string;
}

export interface Order {
	id: string;
	display_id: string;
	customer_id: string;
	referral_partner_id: string | null;
	delivery_address_id: string | null;
	status: "pending" | "ready_for_pickup" | "completed" | "cancelled";
	total_amount: number;
	discount_amount: number;
	delivery_fee: number;
	due_date: string;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface OrderItem {
	id: string;
	order_id: string;
	product_id: string;
	supplier_id: string | null;
	quantity: number;
	price_at_time: number;
	cost_price_at_time: number;
}

export interface OrderPayment {
	id: string;
	order_id: string;
	amount: number;
	method: "Cash" | "UPI" | "Bank Transfer";
	payment_date: string;
	ref_number: string | null;
	notes: string | null;
	created_at: string;
}

export interface OrderCancellation {
	id: string;
	order_id: string;
	reason: string;
	notes: string | null;
	cancelled_at: string;
}

export interface InventoryTransaction {
	id: string;
	product_id: string;
	supplier_id: string | null;
	quantity: number;
	transaction_type: "PURCHASE" | "SALE" | "ADJUSTMENT";
	cost_price: number;
	is_paid: boolean;
	created_at: string;
}

export interface SupplierPayment {
	id: string;
	supplier_id: string | null;
	amount: number;
	payment_date: string;
	notes: string | null;
	created_at: string;
}

// ========== ENHANCED TYPES WITH RELATIONSHIPS ==========

export interface OrderWithRelations extends Order {
	customer: {
		id: string;
		name: string;
		phone: string;
	};
	referral_partner?: ReferralPartner | null;
	delivery_address?: DeliveryAddress | null;
	order_items: OrderItemWithProduct[];
	order_payments: OrderPayment[];
	order_cancellations?: OrderCancellation[];
}

export interface OrderItemWithProduct extends OrderItem {
	product: {
		id: string;
		name: string;
		unit_of_measure: string;
	};
}

// ========== FORM DATA TYPES ==========

export interface OrderFormData {
	customer_id: string;
	referral_partner_id?: string;
	delivery_address_id?: string;
	needs_delivery: boolean;
	delivery_fee: number;
	discount_amount: number;
	due_date: string;
	notes?: string;
	items: OrderItemFormData[];
}

export interface OrderItemFormData {
	product_id: string;
	quantity: number;
	supplier_id?: string;
}

export interface DeliveryAddressFormData {
	address_line1: string;
	address_line2?: string;
	city?: string;
	state?: string;
	zipcode?: string;
	recipient_name: string;
	phone: string;
}

export interface PaymentFormData {
	order_id: string;
	amount: number;
	method: "Cash" | "UPI" | "Card" | "Bank Transfer";
	payment_date: string;
	ref_number?: string;
	notes?: string;
}

export interface CancellationFormData {
	order_id: string;
	reason: string;
	notes?: string;
}

export interface SupplierFormData {
	name: string;
	phone?: string;
	email?: string;
	notes?: string;
}

export interface ReferralPartnerFormData {
	name: string;
	phone?: string;
	commission_type: "percent" | "fixed";
	commission_value: number;
	notes?: string;
}

// ========== FILTER & SEARCH TYPES ==========

export interface OrderFilters {
	status?: ("pending" | "ready_for_pickup" | "completed" | "cancelled")[];
	customer_id?: string;
	referral_partner_id?: string;
	date_from?: string;
	date_to?: string;
	search_query?: string; // customer name or display_id
	needs_delivery?: boolean;
}

// ========== CALCULATED/DERIVED TYPES ==========

export interface OrderFinancials {
	subtotal: number;
	discount_amount: number;
	delivery_fee: number;
	total_amount: number;
	total_paid: number;
	balance_due: number;
	referral_commission: number;
	cost_price_total: number;
	profit: number;
}

export interface ProductStockInfo {
	product_id: string;
	current_stock: number;
	ordered_quantity: number; // in pending/ready orders
	available_stock: number; // current - ordered
	stock_needed: number; // negative if deficit
}

export interface SupplierLedger {
	supplier_id: string;
	supplier_name: string;
	total_purchased: number;
	total_paid: number;
	balance_due: number;
	unpaid_transactions: InventoryTransaction[];
}

// ========== UI COMPONENT PROPS ==========

export interface OrderCardProps {
	order: OrderWithRelations;
	onEdit: (order: OrderWithRelations) => void;
	onView: (order: OrderWithRelations) => void;
	onCancel: (order: OrderWithRelations) => void;
}

export interface OrderFormProps {
	isOpen: boolean;
	onClose: () => void;
	editOrder?: OrderWithRelations | null;
}

// ========== CONSTANTS ==========

export const ORDER_STATUSES = [
	{ value: "pending", label: "Pending", color: "text-orange-600" },
	{
		value: "ready_for_pickup",
		label: "Ready for Pickup",
		color: "text-yellow-600",
	},
	{ value: "completed", label: "Completed", color: "text-green-600" },
	{ value: "cancelled", label: "Cancelled", color: "text-gray-600" },
] as const;

export const PAYMENT_METHODS = [
	{ value: "Cash", label: "Cash" },
	{ value: "UPI", label: "UPI" },
	{ value: "Card", label: "Card" },
	{ value: "Bank Transfer", label: "Bank Transfer" },
] as const;

export const CANCELLATION_REASONS = [
	"Customer requested cancellation",
	"Product unavailable/out of stock",
	"Customer unreachable",
	"Quality issue",
	"Pricing disagreement",
	"Delivery/pickup issue",
	"Duplicate order",
	"Other",
] as const;

export const COMMISSION_TYPES = [
	{ value: "percent", label: "Percentage (%)" },
	{ value: "fixed", label: "Fixed Amount (₹)" },
] as const;

// ========== UTILITY TYPES ==========

export type OrderStatus = Order["status"];
export type PaymentMethod = OrderPayment["method"];
export type CommissionType = ReferralPartner["commission_type"];
export type CancellationReason = (typeof CANCELLATION_REASONS)[number];
