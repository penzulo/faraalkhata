import { useForm } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";
import { useBoolean, useMediaQuery } from "usehooks-ts";
import { z } from "zod";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { ProductWithCurrentPrice } from "@/types/product";

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

type ProfitStatus = "excellent" | "good" | "fair" | "poor" | "loss";

interface ProfitAnalysis {
	profit: number;
	margin: number;
	status: ProfitStatus;
	color: string;
	formatted: {
		profit: string;
		margin: string;
		sellPrice: string;
		costPrice: string;
	};
}

interface UseProductFormProps {
	editProduct?: ProductWithCurrentPrice | null;
	onClose: () => void;
}

const calculateProfitAnalysis = (
	sellPrice: number,
	costPrice: number,
): ProfitAnalysis | null => {
	if (!sellPrice || !costPrice || sellPrice <= 0 || costPrice <= 0) return null;

	const profit = sellPrice - costPrice;
	const margin = (profit / sellPrice) * 100;

	let status: ProfitStatus;
	let color: string;

	if (margin >= 40) {
		status = "excellent";
		color = "text-emerald-600 dark:text-emerald-400";
	} else if (margin >= 30) {
		status = "good";
		color = "text-green-600 dark:text-green-400";
	} else if (margin >= 15) {
		status = "fair";
		color = "text-yellow-600 dark:text-yellow-400";
	} else if (margin > 0) {
		status = "poor";
		color = "text-orange-600 dark:text-orange-400";
	} else {
		status = "loss";
		color = "text-red-600 dark:text-red-400";
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
};

export function useProductForm({ editProduct, onClose }: UseProductFormProps) {
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const { value: showProfitAnalysis, toggle: toggleProfitAnalysis } =
		useBoolean(true);

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

	const form = useForm({
		defaultValues: {
			name: editProduct?.name || "",
			unit_of_measure: editProduct?.unit_of_measure || "",
			sell_price: editProduct?.sell_price || 0,
			cost_price: editProduct?.current_cost_price || 0,
		},
		onSubmit: async ({ value }) => {
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
		},
	});

	const profitAnalysis = useMemo(
		() =>
			calculateProfitAnalysis(
				form.state.values.sell_price,
				form.state.values.cost_price,
			),
		[form.state.values.sell_price, form.state.values.cost_price],
	);

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
		form,
		formMeta,
		isDesktop,
		showProfitAnalysis,
		profitAnalysis,
		unitOptions: UNIT_OPTIONS,
		handleClose,
		handleSubmit,
		toggleProfitAnalysis,
	} as const;
}

export type UseProductFormReturn = ReturnType<typeof useProductForm>;
