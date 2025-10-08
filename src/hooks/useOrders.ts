import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	deliveryAddressesApi,
	ordersApi,
	referralPartnersApi,
	suppliersApi,
} from "@/lib/api/orders";
import type {
	DeliveryAddressFormData,
	OrderFilters,
	OrderFormData,
	ReferralPartnerFormData,
	SupplierFormData,
} from "@/types/order";

// ========== QUERY KEYS ==========
export const ORDERS_QUERY_KEY = ["orders"];
export const DELIVERY_ADDRESSES_QUERY_KEY = ["delivery_addresses"];
export const REFERRAL_PARTNERS_QUERY_KEY = ["referral_partners"];
export const SUPPLIERS_QUERY_KEY = ["suppliers"];

// ========== ORDERS HOOKS ==========

/**
 * Get all orders with optional filters
 */
export function useOrders(filters?: OrderFilters) {
	return useQuery({
		queryKey: [...ORDERS_QUERY_KEY, filters],
		queryFn: () => ordersApi.getOrders(filters),
		staleTime: 1000 * 60 * 2, // 2 minutes (orders change frequently)
	});
}

/**
 * Get a single order by ID
 */
export function useOrder(id: string) {
	return useQuery({
		queryKey: [...ORDERS_QUERY_KEY, id],
		queryFn: () => ordersApi.getOrderById(id),
		staleTime: 1000 * 60 * 2,
		enabled: !!id,
	});
}

/**
 * Create a new order
 */
export function useCreateOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ordersApi.createOrder,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
			// Also invalidate products to update stock
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Order created successfully! 🎉");
		},
		onError: (error) => {
			toast.error("Failed to create order", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Update an existing order
 */
export function useUpdateOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: OrderFormData }) =>
			ordersApi.updateOrder(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Order updated successfully! ✨");
		},
		onError: (error) => {
			toast.error("Failed to update order", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Cancel an order
 */
export function useCancelOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ordersApi.cancelOrder,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Order cancelled successfully 📦");
		},
		onError: (error) => {
			toast.error("Failed to cancel order", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Log a payment for an order
 */
export function useLogPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ordersApi.logPayment,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
			toast.success("Payment recorded successfully! 💰");
		},
		onError: (error) => {
			toast.error("Failed to record payment", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Get order financials/calculations
 */
export function useOrderFinancials(orderId: string) {
	return useQuery({
		queryKey: [...ORDERS_QUERY_KEY, orderId, "financials"],
		queryFn: () => ordersApi.calculateFinancials(orderId),
		enabled: !!orderId,
		staleTime: 1000 * 60 * 1, // 1 minute
	});
}

// ========== DELIVERY ADDRESSES HOOKS ==========

/**
 * Get all delivery addresses for a customer
 */
export function useCustomerAddresses(customerId: string) {
	return useQuery({
		queryKey: [...DELIVERY_ADDRESSES_QUERY_KEY, customerId],
		queryFn: () => deliveryAddressesApi.getCustomerAddresses(customerId),
		enabled: !!customerId,
		staleTime: 1000 * 60 * 10, // 10 minutes (addresses don't change often)
	});
}

/**
 * Create a new delivery address
 */
export function useCreateAddress() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			customerId,
			addressData,
		}: {
			customerId: string;
			addressData: DeliveryAddressFormData;
		}) => deliveryAddressesApi.createAddress(customerId, addressData),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [...DELIVERY_ADDRESSES_QUERY_KEY, variables.customerId],
			});
			toast.success("Address added successfully! 📍");
		},
		onError: (error) => {
			toast.error("Failed to add address", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

// ========== REFERRAL PARTNERS HOOKS ==========

/**
 * Get all active referral partners
 */
export function useReferralPartners() {
	return useQuery({
		queryKey: REFERRAL_PARTNERS_QUERY_KEY,
		queryFn: referralPartnersApi.getReferralPartners,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
}

/**
 * Create a new referral partner
 */
export function useCreateReferralPartner() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: referralPartnersApi.createReferralPartner,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: REFERRAL_PARTNERS_QUERY_KEY });
			toast.success("Referral partner added successfully! 🤝");
		},
		onError: (error) => {
			toast.error("Failed to add referral partner", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Update a referral partner
 */
export function useUpdateReferralPartner() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ReferralPartnerFormData }) =>
			referralPartnersApi.updateReferralPartner(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: REFERRAL_PARTNERS_QUERY_KEY });
			toast.success("Referral partner updated successfully! ✨");
		},
		onError: (error) => {
			toast.error("Failed to update referral partner", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

// ========== SUPPLIERS HOOKS ==========

/**
 * Get all active suppliers
 */
export function useSuppliers() {
	return useQuery({
		queryKey: SUPPLIERS_QUERY_KEY,
		queryFn: suppliersApi.getSuppliers,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
}

/**
 * Create a new supplier
 */
export function useCreateSupplier() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: suppliersApi.createSupplier,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
			toast.success("Supplier added successfully! 📦");
		},
		onError: (error) => {
			toast.error("Failed to add supplier", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Update a supplier
 */
export function useUpdateSupplier() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: SupplierFormData }) =>
			suppliersApi.updateSupplier(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
			toast.success("Supplier updated successfully! ✨");
		},
		onError: (error) => {
			toast.error("Failed to update supplier", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}
