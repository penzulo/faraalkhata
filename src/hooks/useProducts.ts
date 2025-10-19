import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productsApi } from "@/lib/api/products";
import type { ProductFormData } from "@/types/product";

export const PRODUCTS_QUERY_KEY = ["products"];

export function useProducts() {
	return useQuery({
		queryKey: PRODUCTS_QUERY_KEY,
		queryFn: productsApi.getProducts,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

export function useCreateProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: productsApi.createProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
			toast.success("Product created successfully! 🎉");
		},
		onError: (error) => {
			toast.error("Failed to create product", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

export function useUpdateProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
			productsApi.updateProduct(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
			toast.success("Product updated successfully! ✨");
		},
		onError: (error) => {
			toast.error("Failed to update product", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}

export function useDeleteProduct() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: productsApi.deleteProduct,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
			toast.success("Product deleted successfully");
		},
		onError: (error) => {
			toast.error("Failed to delete product", {
				description:
					error instanceof Error ? error.message : "Please try again",
			});
		},
	});
}
