import { useForm } from "@tanstack/react-form";
import { useCallback, useMemo, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { z } from "zod";
import { useCustomers } from "@/hooks/useCustomers";
import {
	useCreateOrder,
	useReferralPartners,
	useUpdateOrder,
} from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import type {
	OrderFormData,
	OrderItemFormData,
	OrderWithRelations,
} from "@/types/order";

// Validation schema
const orderSchema = z.object({
	customer_id: z.string().min(1, "Please select a customer"),
	referral_partner_id: z.string().optional(),
	needs_delivery: z.boolean(),
	delivery_address_id: z.string().optional(),
	delivery_fee: z.number().min(0),
	discount_amount: z.number().min(0),
	due_date: z.string().min(1, "Please select a due date"),
	notes: z.string().optional(),
	items: z
		.array(
			z.object({
				product_id: z.string(),
				quantity: z.number().min(0.01, "Quantity must be greater than 0"),
				supplier_id: z.string().optional(),
			}),
		)
		.min(1, "Please add at least one product"),
});

interface UseOrderFormProps {
	editOrder?: OrderWithRelations | null;
	onClose: () => void;
}

export function useOrderForm({ editOrder, onClose }: UseOrderFormProps) {
	const createOrder = useCreateOrder();
	const updateOrder = useUpdateOrder();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	// Multi-step state
	const [currentStep, setCurrentStep] = useState(1);
	const totalSteps = 3;

	// Data loading
	const { data: customers = [] } = useCustomers();
	const { data: products = [] } = useProducts();
	const { data: referralPartners = [] } = useReferralPartners();

	// Form state
	const formMeta = useMemo(
		() => ({
			isEditing: Boolean(editOrder),
			isLoading: createOrder.isPending || updateOrder.isPending,
			title: editOrder ? "Edit Order" : "Create New Order",
			description: editOrder
				? "Update order details below."
				: "Fill in the details to create a new order.",
			submitText: editOrder ? "Update Order" : "Create Order",
			loadingText: editOrder ? "Updating..." : "Creating...",
		}),
		[editOrder, createOrder.isPending, updateOrder.isPending],
	);

	// Form instance
	const form = useForm({
		defaultValues: {
			customer_id: editOrder?.customer_id || "",
			referral_partner_id: editOrder?.referral_partner_id || "",
			needs_delivery: Boolean(editOrder?.delivery_address_id),
			delivery_address_id: editOrder?.delivery_address_id || "",
			delivery_fee: editOrder?.delivery_fee || 0,
			discount_amount: editOrder?.discount_amount || 0,
			due_date: editOrder?.due_date || new Date().toISOString().split("T")[0],
			notes: editOrder?.notes || "",
			items:
				editOrder?.order_items.map((item) => ({
					product_id: item.product_id,
					quantity: item.quantity,
					supplier_id: item.supplier_id || "",
				})) || [],
		} as OrderFormData,
		onSubmit: async ({ value }) => {
			try {
				const validatedData = orderSchema.parse(value);

				if (formMeta.isEditing && editOrder) {
					await updateOrder.mutateAsync({
						id: editOrder.id,
						data: validatedData,
					});
				} else {
					await createOrder.mutateAsync(validatedData);
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

	// Validators
	const validators = useMemo(
		() => ({
			customer_id: ({ value }: { value: string }) => {
				if (!value) return "Please select a customer";
				return undefined;
			},
			items: ({ value }: { value: OrderItemFormData[] }) => {
				if (value.length === 0) return "Please add at least one product";
				return undefined;
			},
			due_date: ({ value }: { value: string }) => {
				if (!value) return "Please select a due date";
				return undefined;
			},
		}),
		[],
	);

	// Calculate order totals
	const orderCalculations = useMemo(() => {
		const items = form.state.values.items;
		const discount = form.state.values.discount_amount;
		const deliveryFee = form.state.values.delivery_fee;

		const subtotal = items.reduce((sum, item) => {
			const product = products.find((p) => p.id === item.product_id);
			return sum + (product?.sell_price || 0) * item.quantity;
		}, 0);

		const total = subtotal - discount + deliveryFee;

		return {
			subtotal,
			discount,
			deliveryFee,
			total,
			itemCount: items.length,
		};
	}, [
		form.state.values.items,
		form.state.values.discount_amount,
		form.state.values.delivery_fee,
		products,
	]);

	// Step navigation
	const canGoNext = useCallback(() => {
		if (currentStep === 1) {
			return Boolean(form.state.values.customer_id);
		}
		if (currentStep === 2) {
			return form.state.values.items.length > 0;
		}
		return true;
	}, [currentStep, form.state.values.customer_id, form.state.values.items]);

	const goToNextStep = useCallback(() => {
		if (canGoNext() && currentStep < totalSteps) {
			setCurrentStep(currentStep + 1);
		}
	}, [currentStep, canGoNext]);

	const goToPrevStep = useCallback(() => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	}, [currentStep]);

	const goToStep = useCallback((step: number) => {
		if (step >= 1 && step <= totalSteps) {
			setCurrentStep(step);
		}
	}, []);

	// Product item management
	const addProduct = useCallback(
		(productId: string) => {
			const currentItems = form.getFieldValue("items") as OrderItemFormData[];
			const existingItem = currentItems.find(
				(item) => item.product_id === productId,
			);

			if (existingItem) {
				// Increment quantity
				form.setFieldValue(
					"items",
					currentItems.map((item) =>
						item.product_id === productId
							? { ...item, quantity: item.quantity + 1 }
							: item,
					),
				);
			} else {
				// Add new item
				form.setFieldValue("items", [
					...currentItems,
					{ product_id: productId, quantity: 1, supplier_id: "" },
				]);
			}
		},
		[form],
	);

	const removeProduct = useCallback(
		(productId: string) => {
			const currentItems = form.getFieldValue("items") as OrderItemFormData[];
			form.setFieldValue(
				"items",
				currentItems.filter((item) => item.product_id !== productId),
			);
		},
		[form],
	);

	const updateProductQuantity = useCallback(
		(productId: string, quantity: number) => {
			const currentItems = form.getFieldValue("items") as OrderItemFormData[];
			form.setFieldValue(
				"items",
				currentItems.map((item) =>
					item.product_id === productId ? { ...item, quantity } : item,
				),
			);
		},
		[form],
	);

	// Event handlers
	const handleClose = useCallback(() => {
		form.reset();
		setCurrentStep(1);
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
		currentStep,
		totalSteps,

		// Data
		customers,
		products,
		referralPartners,
		validators,
		orderCalculations,

		// Navigation
		canGoNext,
		goToNextStep,
		goToPrevStep,
		goToStep,

		// Product management
		addProduct,
		removeProduct,
		updateProductQuantity,

		// Actions
		handleClose,
		handleSubmit,
	};
}
