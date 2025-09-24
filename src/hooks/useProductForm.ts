import { useForm } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";
import { useBoolean, useMediaQuery } from "usehooks-ts";
import { z } from "zod";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { ProductFormData, ProductWithCurrentPrice } from "@/types/product";

const productSchema = z.object({
	name: z.string().min(2, "Product name must be at least 2 characters"),
	unit_of_measure: z.string().min(1, "Please select a unit of measure"),
	sell_price: z.number().min(0.01, "Sell price must be greater than 0"),
	cost_price: z.number().min(0.01, "Cost price must be greater than 0"),
});

const UNIT_OPTIONS = [
	{ value: "kg", label: "Kilogram (kg)" },
	{ value: "piece", label: "Piece" },
	{ value: "dozen", label: "Dozen" },
	{ value: "gram", label: "Gram (g)" },
	{ value: "liter", label: "Liter (L)" },
	{ value: "packet", label: "Packet" },
	{ value: "box", label: "Box" },
] as const;

interface UseProductFormProps {
	editProduct?: ProductWithCurrentPrice | null;
	onClose: () => void;
}

export function useProductForm({ editProduct, onClose }: UseProductFormProps) {
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	// Enhanced state management
	const { value: showProfitAnalysis, toggle: toggleProfitAnalysis } =
		useBoolean(true);

	// Memoized computed values
	const formMeta = useMemo(
		() => ({
			isEditing: Boolean(editProduct),
			isLoading: createProduct.isPending || updateProduct.isPending,
			title: editProduct ? "Edit Product" : "Add New Product",
			description: editProduct
				? "Update the product details below."
				: "Fill in the details to add a new product to your catalog.",
			submitText: editProduct ? "Update Product" : "Create Product",
			loadingText: editProduct ? "Updating..." : "Creating...",
		}),
		[editProduct, createProduct.isPending, updateProduct.isPending],
	);

	// Form instance
	const form = useForm({
		defaultValues: {
			name: editProduct?.name || "",
			unit_of_measure: editProduct?.unit_of_measure || "",
			sell_price: editProduct?.sell_price || 0,
			cost_price: editProduct?.current_cost_price || 0,
		} as ProductFormData,
		onSubmit: async ({ value }) => {
			try {
				const validatedData = productSchema.parse(value);

				if (formMeta.isEditing && editProduct) {
					await updateProduct.mutateAsync({
						id: editProduct.id,
						data: validatedData,
					});
				} else {
					await createProduct.mutateAsync(validatedData);
				}
				handleClose();
			} catch (error) {
				if (error instanceof z.ZodError) {
					console.error("Validation error:", error.errors);
				} else {
					console.error("Form submission error:", error);
				}
			}
		},
	});

	// Memoized profit analysis
	const profitAnalysis = useMemo(() => {
		const sellPrice = form.state.values.sell_price || 0;
		const costPrice = form.state.values.cost_price || 0;

		if (!sellPrice || !costPrice) {
			return null;
		}

		const profit = sellPrice - costPrice;
		const margin = (profit / sellPrice) * 100;

		let status: "excellent" | "good" | "fair" | "poor" | "loss";
		let color: string;

		if (margin >= 40) {
			status = "excellent";
			color = "text-emerald-600";
		} else if (margin >= 30) {
			status = "good";
			color = "text-green-600";
		} else if (margin >= 15) {
			status = "fair";
			color = "text-yellow-600";
		} else if (margin > 0) {
			status = "poor";
			color = "text-red-600";
		} else {
			status = "loss";
			color = "text-red-700";
		}

		return {
			profit,
			margin,
			status,
			color,
			formatted: {
				profit: `₹${profit.toFixed(2)}`,
				margin: `${margin.toFixed(1)}%`,
				sellPrice: `₹${sellPrice.toFixed(2)}`,
				costPrice: `₹${costPrice.toFixed(2)}`,
			},
		};
	}, [form.state.values.sell_price, form.state.values.cost_price]);

	// Memoized validators
	const validators = useMemo(
		() => ({
			name: ({ value }: { value: string }) => {
				const result = z
					.string()
					.min(2, "Product name must be at least 2 characters")
					.safeParse(value);
				return result.success ? undefined : result.error.errors[0]?.message;
			},
			unit_of_measure: ({ value }: { value: string }) => {
				const result = z
					.string()
					.min(1, "Please select a unit of measure")
					.safeParse(value);
				return result.success ? undefined : result.error.errors[0]?.message;
			},
			sell_price: ({ value }: { value: number }) => {
				const result = z
					.number()
					.min(0.01, "Must be greater than 0")
					.safeParse(value);
				return result.success ? undefined : result.error.errors[0]?.message;
			},
			cost_price: ({ value }: { value: number }) => {
				const result = z
					.number()
					.min(0.01, "Must be greater than 0")
					.safeParse(value);
				return result.success ? undefined : result.error.errors[0]?.message;
			},
		}),
		[],
	);

	// Event handlers
	const handleClose = useCallback(() => {
		form.reset();
		onClose();
	}, [form, onClose]);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	return {
		// State
		form,
		formMeta,
		isDesktop,
		showProfitAnalysis,

		// Data
		profitAnalysis,
		validators,
		unitOptions: UNIT_OPTIONS,

		// Actions
		handleClose,
		handleSubmit,
		toggleProfitAnalysis,
	};
}
