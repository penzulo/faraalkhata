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
import { useCreateAddress } from "@/hooks/useOrders";

interface DeliveryAddressFormProps {
	isOpen: boolean;
	onClose: () => void;
	customerId: string;
	onSuccess: (addressId: string) => void;
}

const addressSchema = z.object({
	recipient_name: z
		.string()
		.min(2, "Recipient name must be at least 2 characters"),
	phone: z
		.string()
		.regex(
			/^[6-9]\d{9}$/,
			"Please enter a valid 10-digit Indian mobile number",
		),
	address_line1: z.string().min(5, "Address must be at least 5 characters"),
	address_line2: z.string().optional(),
	city: z
		.string()
		.min(2, "City must be at least 2 characters")
		.optional()
		.or(z.literal("")),
	state: z
		.string()
		.min(2, "State must be at least 2 characters")
		.optional()
		.or(z.literal("")),
	zipcode: z
		.string()
		.regex(/^\d{6}$/, "Zipcode must be 6 digits")
		.optional()
		.or(z.literal("")),
});

type AddressFormData = z.infer<typeof addressSchema>;

const INITIAL_FORM_STATE: AddressFormData = {
	recipient_name: "",
	phone: "",
	address_line1: "",
	address_line2: "",
	city: "",
	state: "",
	zipcode: "",
};

type FormErrors = Partial<Record<keyof AddressFormData, string>>;

export function DeliveryAddressForm({
	isOpen,
	onClose,
	customerId,
	onSuccess,
}: DeliveryAddressFormProps) {
	const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM_STATE);
	const [errors, setErrors] = useState<FormErrors>({});
	const [touched, setTouched] = useState<
		Partial<Record<keyof AddressFormData, boolean>>
	>({});

	const createAddress = useCreateAddress();

	const recipientId = useId();
	const phoneId = useId();
	const line1Id = useId();
	const line2Id = useId();
	const cityId = useId();
	const stateId = useId();
	const zipcodeId = useId();

	const isLoading = useMemo(
		() => createAddress.isPending,
		[createAddress.isPending],
	);

	const handleFieldChange = useCallback(
		<K extends keyof AddressFormData>(field: K, value: AddressFormData[K]) => {
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
		(field: keyof AddressFormData) => {
			setTouched((prev) => ({ ...prev, [field]: true }));

			try {
				addressSchema.shape[field].parse(formData[field]);
			} catch (e) {
				if (e instanceof z.ZodError) {
					setErrors((prev) => ({
						...prev,
						[field]: e.errors[0]?.message,
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

	const handleZipcodeChange = useCallback(
		(value: string) => {
			const cleaned = value.replace(/\D/g, "").slice(0, 6);
			handleFieldChange("zipcode", cleaned);
		},
		[handleFieldChange],
	);

	const resetForm = useCallback(() => {
		setFormData(INITIAL_FORM_STATE);
		setErrors({});
		setTouched({});
	}, []);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();

			const allTouched: Partial<Record<keyof AddressFormData, boolean>> = {
				recipient_name: true,
				phone: true,
				address_line1: true,
			};
			setTouched(allTouched);

			const validation = addressSchema.safeParse(formData);

			if (!validation.success) {
				const newErrors: FormErrors = {};
				validation.error.errors.forEach((err) => {
					const path = err.path[0] as keyof AddressFormData;
					newErrors[path] = err.message;
				});
				setErrors(newErrors);
				return;
			}

			createAddress.mutate(
				{ customerId, addressData: validation.data },
				{
					onSuccess: (result) => {
						resetForm();
						toast.success("Delivery address added successfully");
						onSuccess(result.id);
						onClose();
					},
					onError: (err) => {
						console.error("Failed to create address:", err);
						toast.error(
							err instanceof Error
								? err.message
								: "Failed to create address. Please try again",
						);
					},
				},
			);
		},
		[formData, customerId, createAddress, resetForm, onSuccess, onClose],
	);

	const handleClose = useCallback(() => {
		if (!isLoading) {
			resetForm();
			onClose();
		}
	}, [isLoading, resetForm, onClose]);

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="text-foreground">
						Add Delivery Address
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						Enter the delivery address for this order
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Recipient Name */}
						<div className="space-y-2">
							<Label htmlFor={recipientId} className="text-foreground">
								Recipient Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id={recipientId}
								value={formData.recipient_name}
								onChange={(e) =>
									handleFieldChange("recipient_name", e.target.value)
								}
								onBlur={() => handleFieldBlur("recipient_name")}
								disabled={isLoading}
								aria-invalid={touched.recipient_name && !!errors.recipient_name}
								placeholder="Enter recipient name"
							/>
							{touched.recipient_name && errors.recipient_name && (
								<p className="text-destructive text-sm" role="alert">
									{errors.recipient_name}
								</p>
							)}
						</div>

						{/* Phone */}
						<div className="space-y-2">
							<Label htmlFor={phoneId} className="text-foreground">
								Phone <span className="text-destructive">*</span>
							</Label>
							<div className="relative">
								<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-muted-foreground text-sm">
									+91
								</span>
								<Input
									id={phoneId}
									type="tel"
									value={formData.phone}
									onChange={(e) => handlePhoneChange(e.target.value)}
									onBlur={() => handleFieldBlur("phone")}
									disabled={isLoading}
									className="pl-12"
									maxLength={10}
									aria-invalid={touched.phone && !!errors.phone}
									placeholder="98765 43210"
								/>
							</div>
							{touched.phone && errors.phone && (
								<p className="text-destructive text-sm" role="alert">
									{errors.phone}
								</p>
							)}
						</div>

						{/* Address Line 1 */}
						<div className="space-y-2">
							<Label htmlFor={line1Id} className="text-foreground">
								Address Line 1 <span className="text-destructive">*</span>
							</Label>
							<Input
								id={line1Id}
								value={formData.address_line1}
								onChange={(e) =>
									handleFieldChange("address_line1", e.target.value)
								}
								onBlur={() => handleFieldBlur("address_line1")}
								disabled={isLoading}
								aria-invalid={touched.address_line1 && !!errors.address_line1}
								placeholder="Street address, P.O. box"
							/>
							{touched.address_line1 && errors.address_line1 && (
								<p className="text-destructive text-sm" role="alert">
									{errors.address_line1}
								</p>
							)}
						</div>

						{/* Address Line 2 */}
						<div className="space-y-2">
							<Label htmlFor={line2Id} className="text-foreground">
								Address Line 2{" "}
								<span className="font-normal text-muted-foreground text-xs">
									(Optional)
								</span>
							</Label>
							<Input
								id={line2Id}
								value={formData.address_line2}
								onChange={(e) =>
									handleFieldChange("address_line2", e.target.value)
								}
								disabled={isLoading}
								placeholder="Apartment, suite, unit, building"
							/>
						</div>

						{/* City, State, Zipcode */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-2">
								<Label htmlFor={cityId} className="text-foreground text-sm">
									City
								</Label>
								<Input
									id={cityId}
									value={formData.city}
									onChange={(e) => handleFieldChange("city", e.target.value)}
									disabled={isLoading}
									placeholder="City"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={stateId} className="text-foreground text-sm">
									State
								</Label>
								<Input
									id={stateId}
									value={formData.state}
									onChange={(e) => handleFieldChange("state", e.target.value)}
									disabled={isLoading}
									placeholder="State"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={zipcodeId} className="text-foreground text-sm">
									Zipcode
								</Label>
								<Input
									id={zipcodeId}
									value={formData.zipcode}
									onChange={(e) => handleZipcodeChange(e.target.value)}
									disabled={isLoading}
									maxLength={6}
									placeholder="123456"
								/>
							</div>
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
							{isLoading ? "Adding..." : "Add Address"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
