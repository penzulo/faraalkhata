import { useForm, useStore } from "@tanstack/react-form";
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

const orderItemSchema = z.object({
	product_id: z.string().min(1, "Product is required"),
	quantity: z.number().min(0.01, "Quantity must be greater than 0"),
	supplier_id: z.string().optional(),
});

const orderSchema = z.object({
	customer_id: z.string().min(1, "Please select a customer"),
	referral_partner_id: z.string().optional(),
	needs_delivery: z.boolean(),
	delivery_address_id: z.string().optional(),
	delivery_fee: z.number().min(0, "Delivery fee cannot be negative"),
	discount_amount: z.number().min(0, "Discount cannot be negative"),
	due_date: z.string().min(1, "Please select a due date"),
	notes: z
		.string()
		.max(1000, "Notes must be less than 1000 characters")
		.optional(),
	items: z.array(orderItemSchema).min(1, "Please add at least one product"),
});

const STEPS = [
	{ number: 1, title: "Customer", key: "customer" },
	{ number: 2, title: "Products", key: "products" },
	{ number: 3, title: "Review", key: "review" },
] as const;

export type StepNumber = (typeof STEPS)[number]["number"];

interface OrderCalculations {
	subtotal: number;
	discount: number;
	deliveryFee: number;
	total: number;
	itemCount: number;
}

interface UseOrderFormProps {
	editOrder?: OrderWithRelations | null;
	onClose: () => void;
}

const calculateOrderTotals = (
	items: OrderItemFormData[],
	products: Array<{ id: string; sell_price: number }>,
	discountAmount: number,
	deliveryFee: number,
): OrderCalculations => {
	const subtotal = items.reduce((sum, item) => {
		const product = products.find((p) => p.id === item.product_id);
		return sum + (product?.sell_price ?? 0) * item.quantity;
	}, 0);

	const total = Math.max(0, subtotal - discountAmount + deliveryFee);

	return {
		subtotal,
		discount: discountAmount,
		deliveryFee,
		total,
		itemCount: items.length,
	};
};

export function useOrderForm({ editOrder, onClose }: UseOrderFormProps) {
	const createOrder = useCreateOrder();
	const updateOrder = useUpdateOrder();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const [currentStep, setCurrentStep] = useState<StepNumber>(1);

	const { data: customers = [] } = useCustomers();
	const { data: products = [] } = useProducts();
	const { data: referralPartners = [] } = useReferralPartners();

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
					supplier_id: item.supplier_id ?? "",
				})) ?? [],
		} as OrderFormData,
		onSubmit: async ({ value }) => {
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
		},
	});

	const { customerId, items, discountAmount, deliveryFee } = useStore(
		form.store,
		(s) => ({
			customerId: s.values.customer_id,
			items: s.values.items,
			discountAmount: s.values.discount_amount,
			deliveryFee: s.values.delivery_fee,
		}),
	);

	const orderCalculations = useMemo((): OrderCalculations => {
		if (!products)
			return {
				subtotal: 0,
				discount: 0,
				deliveryFee: 0,
				total: 0,
				itemCount: 0,
			};
		return calculateOrderTotals(items, products, discountAmount, deliveryFee);
	}, [items, discountAmount, deliveryFee, products]);

	const canGoNext = useMemo((): boolean => {
		switch (currentStep) {
			case 1:
				return Boolean(customerId && customerId.trim() !== "");
			case 2:
				return items.length > 0;
			case 3:
				return true;
			default:
				return false;
		}
	}, [currentStep, customerId, items.length]);

	const goToNextStep = useCallback(() => {
		if (canGoNext && currentStep < STEPS.length) {
			setCurrentStep((prev) => Math.min(prev + 1, STEPS.length) as StepNumber);
		}
	}, [currentStep, canGoNext]);

	const goToPrevStep = useCallback(() => {
		if (currentStep > 1) {
			setCurrentStep((prev) => Math.max(prev - 1, 1) as StepNumber);
		}
	}, [currentStep]);

	const goToStep = useCallback((step: StepNumber) => {
		if (step >= 1 && step <= STEPS.length) {
			setCurrentStep(step);
		}
	}, []);

	const addProduct = useCallback(
		(productId: string) => {
			const currentItems = form.getFieldValue("items") as OrderItemFormData[];
			const existingItemIndex = currentItems.findIndex(
				(item) => item.product_id === productId,
			);

			if (existingItemIndex !== -1) {
				const updatedItems = [...currentItems];
				updatedItems[existingItemIndex] = {
					...updatedItems[existingItemIndex],
					quantity: updatedItems[existingItemIndex].quantity + 1,
				};
				form.setFieldValue("items", updatedItems);
			} else {
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
			if (quantity < 0) {
				removeProduct(productId);
				return;
			}

			const currentItems = form.getFieldValue("items") as OrderItemFormData[];
			form.setFieldValue(
				"items",
				currentItems.map((item) =>
					item.product_id === productId ? { ...item, quantity } : item,
				),
			);
		},
		[form, removeProduct],
	);

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
		form,
		formMeta,
		isDesktop,
		currentStep,
		totalSteps: STEPS.length,
		steps: STEPS,
		customers: customers ?? [],
		products: products ?? [],
		referralPartners: referralPartners ?? [],
		orderCalculations,
		canGoNext,
		goToNextStep,
		goToPrevStep,
		goToStep,
		addProduct,
		removeProduct,
		updateProductQuantity,
		handleClose,
		handleSubmit,
	} as const;
}

export type UseOrderFormReturn = ReturnType<typeof useOrderForm>;
