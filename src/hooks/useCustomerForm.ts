import { useForm } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";
import { useBoolean, useMediaQuery } from "usehooks-ts";
import { z } from "zod";
import {
	useCategories,
	useCreateCustomer,
	useUpdateCustomer,
} from "@/hooks/useCustomers";
import { customerUtils } from "@/lib/api/customers";
import type {
	CustomerFormData,
	CustomerWithCategories,
} from "@/types/customer";

const customerSchema = z.object({
	name: z.string().min(2, "Customer name must be at least 2 characters"),
	phone: z
		.string()
		.regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
		.transform((val) => customerUtils.cleanPhoneNumber(val)),
	notes: z.string().optional(),
	category_ids: z.array(z.string()).default([]),
});

const CATEGORY_COLORS = [
	"#FF8C42",
	"#FFB347",
	"#B85450",
	"#464C56",
	"#717680",
] as const;

interface UseCustomerFormProps {
	editCustomer?: CustomerWithCategories | null;
	onClose: () => void;
}

export function useCustomerForm({
	editCustomer,
	onClose,
}: UseCustomerFormProps) {
	const createCustomer = useCreateCustomer();
	const updateCustomer = useUpdateCustomer();
	const { data: categories = [] } = useCategories();
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const { value: showCategoryManager, toggle: toggleCategoryManager } =
		useBoolean(false);

	const formMeta = useMemo(
		() => ({
			isEditing: Boolean(editCustomer),
			isLoading: createCustomer.isPending || updateCustomer.isPending,
			title: editCustomer ? "Edit Customer" : "Add New Customer",
			description: editCustomer
				? "Update the customer details below."
				: "Fill in the details to add a new customer to your directory.",
			submitText: editCustomer ? "Update Customer" : "Add Customer",
			loadingText: editCustomer ? "Updating..." : "Adding...",
		}),
		[editCustomer, createCustomer.isPending, updateCustomer.isPending],
	);

	const form = useForm({
		defaultValues: {
			name: editCustomer?.name || "",
			phone: editCustomer?.phone || "",
			notes: editCustomer?.notes || "",
			category_ids: editCustomer?.categories.map((cat) => cat.id) || [],
		} as CustomerFormData,
		onSubmit: async ({ value }) => {
			try {
				const validatedData = customerSchema.parse(value);

				if (formMeta.isEditing && editCustomer) {
					await updateCustomer.mutateAsync({
						id: editCustomer.id,
						data: validatedData,
					});
				} else {
					await createCustomer.mutateAsync(validatedData);
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

	const customerInsights = useMemo(() => {
		const name = form.state.values.name;
		const phone = form.state.values.phone;
		const selectedCategories = form.state.values.category_ids;

		if (!name && !phone) {
			return null;
		}

		const initials = customerUtils.getCustomerInitials(name || "");
		const avatarColor = customerUtils.getAvatarColor(name || "Customer");
		const isPhoneValid = customerUtils.isValidIndianPhone(phone);
		const formattedPhone = phone ? customerUtils.formatPhoneNumber(phone) : "";

		const selectedCategoryNames = categories
			.filter((cat) => selectedCategories.includes(cat.id))
			.map((cat) => cat.name);

		let completionStatus: "excellent" | "good" | "fair" | "minimal";
		let completionColor: string;

		const completionScore =
			(name ? 25 : 0) +
			(phone && isPhoneValid ? 35 : 0) +
			(form.state.values.notes ? 20 : 0) +
			(selectedCategories.length > 0 ? 20 : 0);

		if (completionScore >= 80) {
			completionStatus = "excellent";
			completionColor = "text-emerald-600";
		} else if (completionScore >= 60) {
			completionStatus = "good";
			completionColor = "text-green-600";
		} else if (completionScore >= 40) {
			completionStatus = "fair";
			completionColor = "text-yellow-600";
		} else {
			completionStatus = "minimal";
			completionColor = "text-red-600";
		}

		return {
			initials,
			avatarColor,
			isPhoneValid,
			formattedPhone,
			selectedCategoryNames,
			completionScore,
			completionStatus,
			completionColor,
			formatted: {
				completion: `${completionScore}%`,
				categories: selectedCategoryNames.join(", ") || "No categories",
				phone: formattedPhone || "Not provided",
			},
		};
	}, [
		form.state.values.name,
		form.state.values.phone,
		form.state.values.notes,
		form.state.values.category_ids,
		categories,
	]);

	const validators = useMemo(
		() => ({
			name: ({ value }: { value: string }) => {
				const result = z
					.string()
					.min(2, "Customer name must be at least 2 characters")
					.safeParse(value);
				return result.success ? undefined : result.error.errors[0]?.message;
			},
			phone: ({ value }: { value: string }) => {
				const result = z
					.string()
					.regex(
						/^[6-9]\d{9}$/,
						"Please enter a valid 10-digit Indian mobile number",
					)
					.safeParse(customerUtils.cleanPhoneNumber(value));
				return result.success ? undefined : result.error.errors[0]?.message;
			},
			notes: ({ value }: { value: string | undefined }) => {
				if (!value) return undefined;
				if (value.length > 500) {
					return "Notes should be less than 500 characters";
				}
				return undefined;
			},
			categofy_ids: () => {
				return undefined;
			},
		}),
		[],
	);

	const categoryOptions = useMemo(() => {
		return categories.map((category, index) => ({
			value: category.id,
			label: category.name,
			color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
		}));
	}, [categories]);

	const formatPhoneForDisplay = useCallback((phone: string) => {
		const cleaned = customerUtils.cleanPhoneNumber(phone);
		return customerUtils.formatPhoneNumber(cleaned);
	}, []);

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

	const handlePhoneChange = useCallback((value: string) => {
		const cleaned = value.replace(/\D/g, "");
		const limited = cleaned.slice(0, 10);
		return limited;
	}, []);

	const addCategory = useCallback(
		(categoryId: string) => {
			const currentIds = form.getFieldValue("category_ids") as string[];
			if (!currentIds.includes(categoryId)) {
				form.setFieldValue("category_ids", [...currentIds, categoryId]);
			}
		},
		[form],
	);

	const removeCategory = useCallback(
		(categoryId: string) => {
			const currentIds = form.getFieldValue("category_ids") as string[];
			form.setFieldValue(
				"category_ids",
				currentIds.filter((id) => id !== categoryId),
			);
		},
		[form],
	);

	const toggleCategory = useCallback(
		(categoryId: string) => {
			const currentIds = form.getFieldValue("category_ids") as string[];
			if (currentIds.includes(categoryId)) {
				removeCategory(categoryId);
			} else {
				addCategory(categoryId);
			}
		},
		[addCategory, removeCategory, form.getFieldValue],
	);

	return {
		form,
		formMeta,
		isDesktop,
		showCategoryManager,
		customerInsights,
		validators,
		categoryOptions,
		handleClose,
		handleSubmit,
		handlePhoneChange,
		formatPhoneForDisplay,
		toggleCategoryManager,
		addCategory,
		removeCategory,
		toggleCategory,
		utils: {
			getInitials: customerUtils.getCustomerInitials,
			getAvatarColor: customerUtils.getAvatarColor,
			isValidPhone: customerUtils.isValidIndianPhone,
			formatPhone: customerUtils.formatPhoneNumber,
		},
	};
}

export type UseCustomerFormReturn = ReturnType<typeof useCustomerForm>;
