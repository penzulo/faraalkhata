import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesApi, customersApi } from "@/lib/api/customers";
import type {
	CategoryFormData,
	CustomerFormData,
	CustomerSearchParams,
} from "@/types/customer";

// Query keys following your pattern
export const CUSTOMERS_QUERY_KEY = ["customers"];
export const CATEGORIES_QUERY_KEY = ["categories"];

/**
 * Get all customers with optional search/filter parameters
 */
export function useCustomers(params?: CustomerSearchParams) {
	return useQuery({
		queryKey: [...CUSTOMERS_QUERY_KEY, params],
		queryFn: () => customersApi.getCustomers(params),
		staleTime: 1000 * 60 * 5, // 5 minutes (matching your product pattern)
	});
}

/**
 * Get a single customer by ID
 */
export function useCustomer(id: string) {
	return useQuery({
		queryKey: [...CUSTOMERS_QUERY_KEY, id],
		queryFn: () => customersApi.getCustomerById(id),
		staleTime: 1000 * 60 * 5,
		enabled: !!id, // Only run if ID exists
	});
}

/**
 * Create a new customer
 */
export function useCreateCustomer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: customersApi.createCustomer,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
			toast.success("Customer added successfully! 🎉");
		},
		onError: (error) => {
			toast.error("Failed to create customer", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Update an existing customer
 */
export function useUpdateCustomer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
			customersApi.updateCustomer(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
			toast.success("Customer updated successfully! ✨");
		},
		onError: (error) => {
			toast.error("Failed to update customer", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Archive/Unarchive a customer (soft delete)
 */
export function useArchiveCustomer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: customersApi.archiveCustomer,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
			const action = variables.is_archived ? "archived" : "restored";
			toast.success(
				`Customer ${action} successfully! ${variables.is_archived ? "📦" : "✨"}`,
			);
		},
		onError: (error) => {
			toast.error("Failed to archive customer", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Permanently delete a customer (use with extreme caution)
 */
export function useDeleteCustomer() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: customersApi.deleteCustomer,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
			toast.success("Customer deleted permanently");
		},
		onError: (error) => {
			toast.error("Failed to delete customer", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Search customers (for fuzzy search)
 */
export function useSearchCustomers(query: string, includeArchived = false) {
	return useQuery({
		queryKey: [...CUSTOMERS_QUERY_KEY, "search", query, includeArchived],
		queryFn: () => customersApi.searchCustomers(query, includeArchived),
		enabled: query.length > 0, // Only search if there's a query
		staleTime: 1000 * 30, // 30 seconds (shorter for search results)
	});
}

// Category-related hooks
/**
 * Get all categories
 */
export function useCategories() {
	return useQuery({
		queryKey: CATEGORIES_QUERY_KEY,
		queryFn: categoriesApi.getCategories,
		staleTime: 1000 * 60 * 10, // 10 minutes (categories change less frequently)
	});
}

/**
 * Create a new category
 */
export function useCreateCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: categoriesApi.createCategory,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
			toast.success("Category created successfully! 🏷");
		},
		onError: (error) => {
			toast.error("Failed to create category", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Update a category
 */
export function useUpdateCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
			categoriesApi.updateCategory(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
			// Also invalidate customers as their category names might have changed
			queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
			toast.success("Category updated successfully! ✨");
		},
		onError: (error) => {
			toast.error("Failed to update category", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Delete a category
 */
export function useDeleteCategory() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: categoriesApi.deleteCategory,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
			toast.success("Category deleted successfully");
		},
		onError: (error) => {
			toast.error("Failed to delete category", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

/**
 * Get category usage statistics
 */
export function useCategoryStats() {
	return useQuery({
		queryKey: [...CATEGORIES_QUERY_KEY, "stats"],
		queryFn: categoriesApi.getCategoryStats,
		staleTime: 1000 * 60 * 15, // 15 minutes
	});
}
