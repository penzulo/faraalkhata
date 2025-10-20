import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CUSTOMERS_QUERY_KEY, useCreateCustomer } from "@/hooks/useCustomers";
import { customerUtils } from "@/lib/api/customers";

interface CustomerQuickAddProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (customerId: string) => void;
}

const customerQuickAddSchema = z.object({
	name: z.string().min(2, "Customer name must be at least 2 characters"),
	phone: z
		.string()
		.regex(
			/^[6-9]\d{9}$/,
			"Please enter a valid 10-digit Indian mobile number",
		),
});

type CustomerQuickAddData = z.infer<typeof customerQuickAddSchema>;

type FormErrors = Partial<Record<keyof CustomerQuickAddData, string>>;

const INITIAL_FORM_STATE: CustomerQuickAddData = {
	name: "",
	phone: "",
};

export function CustomerQuickAdd({
	isOpen,
	onClose,
	onSuccess,
}: CustomerQuickAddProps) {
	const [formData, setFormData] =
		useState<CustomerQuickAddData>(INITIAL_FORM_STATE);
	const [errors, setErrors] = useState<FormErrors>({});
	const [touched, setTouched] = useState<
		Partial<Record<keyof CustomerQuickAddData, boolean>>
	>({});

	const queryClient = useQueryClient();
	const createCustomer = useCreateCustomer();

	const nameId = useId();
	const phoneId = useId();

	const isLoading = useMemo(
		() => createCustomer.isPending,
		[createCustomer.isPending],
	);

	const handleFieldChange = useCallback(
		<K extends keyof CustomerQuickAddData>(
			field: K,
			value: CustomerQuickAddData[K],
		) => {
			setFormData((prev) => ({ ...prev, [field]: value }));

			if (errors[field]) {
				setErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[field];
					return newErrors;
				});
			}
		},
		[errors],
	);

	const handleFieldBlur = useCallback(
		(field: keyof CustomerQuickAddData) => {
			setTouched((prev) => ({ ...prev, [field]: true }));

			try {
				customerQuickAddSchema.shape[field].parse(formData[field]);
			} catch (error) {
				if (error instanceof z.ZodError) {
					setErrors((prev) => ({
						...prev,
						[field]: error.errors[0]?.message,
					}));
				}
			}
		},
		[formData],
	);

	const handlePhoneChange = useCallback(
		(value: string) => {
			const cleaned = value.replace(/\D/g, "").slice(0, 10);
			handleFieldChange("phone", cleaned);
		},
		[handleFieldChange],
	);

	const resetForm = useCallback(() => {
		setFormData(INITIAL_FORM_STATE);
		setErrors({});
		setTouched({});
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			setTouched({ name: true, phone: true });

			const validation = customerQuickAddSchema.safeParse(formData);

			if (!validation.success) {
				const newErrors: FormErrors = {};
				validation.error.errors.forEach((error) => {
					const path = error.path[0] as keyof CustomerQuickAddData;
					newErrors[path] = error.message;
				});
				setErrors(newErrors);
				return;
			}

			try {
				const result = await createCustomer.mutateAsync({
					name: validation.data.name,
					phone: validation.data.phone,
					category_ids: [],
				});

				await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });

				resetForm();
				toast.success(`Customer "${validation.data.name}" added successfully`);

				onSuccess(result.id);
				onClose();
			} catch (error) {
				console.error("Failed to create customer:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to add customer. Please try again.",
				);
			}
		},
		[formData, createCustomer, queryClient, resetForm, onSuccess, onClose],
	);

	const handleClose = useCallback(() => {
		if (!isLoading) {
			resetForm();
			onClose();
		}
	}, [isLoading, resetForm, onClose]);

	const isPhoneValid = useMemo(() => {
		return (
			formData.phone.length === 10 &&
			customerUtils.isValidIndianPhone(formData.phone)
		);
	}, [formData.phone]);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-foreground">
						Add New Customer
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						Quickly add a customer with just name and phone
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Name Field */}
						<div className="space-y-2">
							<Label htmlFor={nameId} className="text-foreground">
								Customer Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id={nameId}
								placeholder="Enter customer name"
								value={formData.name}
								onChange={(e) => handleFieldChange("name", e.target.value)}
								onBlur={() => handleFieldBlur("name")}
								disabled={isLoading}
								aria-invalid={touched.name && !!errors.name}
								autoFocus
							/>
							{touched.name && errors.name && (
								<p className="text-destructive text-sm" role="alert">
									{errors.name}
								</p>
							)}
						</div>

						{/* Phone Field */}
						<div className="space-y-2">
							<Label htmlFor={phoneId} className="text-foreground">
								Phone Number <span className="text-destructive">*</span>
							</Label>
							<div className="relative">
								<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-muted-foreground text-sm">
									+91
								</span>
								<Input
									id={phoneId}
									type="tel"
									placeholder="98765 43210"
									value={formData.phone}
									onChange={(e) => handlePhoneChange(e.target.value)}
									onBlur={() => handleFieldBlur("phone")}
									disabled={isLoading}
									className="pl-12"
									maxLength={10}
									aria-invalid={touched.phone && !!errors.phone}
								/>
							</div>
							{touched.phone && errors.phone ? (
								<p className="text-destructive text-sm" role="alert">
									{errors.phone}
								</p>
							) : (
								formData.phone &&
								isPhoneValid && (
									<p className="text-green-600 text-xs dark:text-green-400">
										✓ Valid Indian mobile number
									</p>
								)
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Adding..." : "Add Customer"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
