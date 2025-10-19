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
import type { CustomerWithCategories } from "@/types/customer";

const customerSchema = z.object({
	name: z.string().min(2, "Customer name must be at least 2 characters"),
	phone: z
		.string()
		.min(1, "Phone number is required")
		.regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
		.transform((val) => customerUtils.cleanPhoneNumber(val)),
	notes: z
		.string()
		.max(500, "Notes should be less than 500 characters.")
		.optional(),
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

const calculateCompletionScore = (
	hasName: boolean,
	isPhoneValid: boolean,
	hasNotes: boolean,
	hasCategoryIds: boolean,
): {
	score: number;
	status: "excellent" | "good" | "fair" | "minimal";
	color: string;
} => {
	const score =
		(hasName ? 25 : 0) +
		(isPhoneValid ? 35 : 0) +
		(hasNotes ? 20 : 0) +
		(hasCategoryIds ? 20 : 0);

	let status: "excellent" | "good" | "fair" | "minimal";
	let color: string;

	if (score >= 80) {
		status = "excellent";
		color = "text-emerald-600";
	} else if (score >= 60) {
		status = "good";
		color = "text-green-600";
	} else if (score >= 40) {
		status = "fair";
		color = "text-yellow-600";
	} else {
		status = "minimal";
		color = "text-red-600";
	}

	return { score, status, color };
};

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
		},
		onSubmit: async ({ value }) => {
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
		},
	});

	const categoryOptions = useMemo(() => {
		return categories.map((category, index) => ({
			value: category.id,
			label: category.name,
			color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
		}));
	}, [categories]);

	const customerInsights = useMemo(() => {
		const {
			name,
			phone,
			notes,
			category_ids: selectedCategories,
		} = form.state.values;

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

		const completion = calculateCompletionScore(
			Boolean(name),
			isPhoneValid,
			Boolean(notes),
			selectedCategories.length > 0,
		);

		return {
			initials,
			avatarColor,
			isPhoneValid,
			formattedPhone,
			selectedCategoryNames,
			completionScore: completion.score,
			completionStatus: completion.status,
			completionColor: completion.color,
			formatted: {
				completion: `${completion.score}%`,
				categories: selectedCategoryNames.join(", ") || "No categories",
				phone: formattedPhone || "Not provided",
			},
		};
	}, [form.state.values, categories]);

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

	const handlePhoneChange = useCallback(
		(value: string): string => value.replace(/\D/g, "").slice(0, 10),
		[],
	);

	const toggleCategory = useCallback(
		(categoryId: string) => {
			form.setFieldValue("category_ids", (prev: string[]) =>
				prev.includes(categoryId)
					? prev.filter((id) => id !== categoryId)
					: [...prev, categoryId],
			);
		},
		[form],
	);

	return {
		form,
		formMeta,
		isDesktop,
		showCategoryManager,
		customerInsights,
		categoryOptions,
		handleClose,
		handleSubmit,
		handlePhoneChange,
		toggleCategoryManager,
		toggleCategory,
	} as const;
}

export type UseCustomerFormReturn = ReturnType<typeof useCustomerForm>;
