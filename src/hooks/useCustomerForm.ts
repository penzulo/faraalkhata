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

// Enhanced validation schema following your product pattern
const customerSchema = z.object({
	name: z.string().min(2, "Customer name must be at least 2 characters"),
	phone: z
		.string()
		.regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
		.transform((val) => customerUtils.cleanPhoneNumber(val)),
	notes: z.string().optional(),
	category_ids: z.array(z.string()).default([]),
});

// Predefined category options
const CATEGORY_COLORS = [
	"#FF8C42", // faraal-saffron
	"#FFB347", // faraal-gold
	"#B85450", // faraal-terracotta
	"#464C56", // faraal-dark-gray
	"#717680", // faraal-medium-gray
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

	// Enhanced state management
	const { value: showCategoryManager, toggle: toggleCategoryManager } =
		useBoolean(false);

	// Memoized computed values following your pattern
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

	// Form instance with proper error handling
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

	// Memoized customer insights (similar to your profit analysis)
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

		// Category analysis
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

	// Memoized validators following your exact pattern
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
				// Optional field, so we just check if it's reasonable length
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

	// Category options with enhanced metadata
	const categoryOptions = useMemo(() => {
		return categories.map((category, index) => ({
			value: category.id,
			label: category.name,
			color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
		}));
	}, [categories]);

	// Phone number formatting helper
	const formatPhoneForDisplay = useCallback((phone: string) => {
		const cleaned = customerUtils.cleanPhoneNumber(phone);
		return customerUtils.formatPhoneNumber(cleaned);
	}, []);

	// Event handlers following your pattern
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

	// Phone number input handler with auto-formatting
	const handlePhoneChange = useCallback((value: string) => {
		// Remove all non-digits
		const cleaned = value.replace(/\D/g, "");
		// Limit to 10 digits
		const limited = cleaned.slice(0, 10);
		return limited;
	}, []);

	// Category management helpers
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
		// State
		form,
		formMeta,
		isDesktop,
		showCategoryManager,

		// Data
		customerInsights,
		validators,
		categoryOptions,

		// Actions
		handleClose,
		handleSubmit,
		handlePhoneChange,
		formatPhoneForDisplay,
		toggleCategoryManager,
		addCategory,
		removeCategory,
		toggleCategory,

		// Helper utilities
		utils: {
			getInitials: customerUtils.getCustomerInitials,
			getAvatarColor: customerUtils.getAvatarColor,
			isValidPhone: customerUtils.isValidIndianPhone,
			formatPhone: customerUtils.formatPhoneNumber,
		},
	};
}
