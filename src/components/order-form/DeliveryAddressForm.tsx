import { useId, useState } from "react";
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

export function DeliveryAddressForm({
	isOpen,
	onClose,
	customerId,
	onSuccess,
}: DeliveryAddressFormProps) {
	const [formData, setFormData] = useState({
		recipient_name: "",
		phone: "",
		address_line1: "",
		address_line2: "",
		city: "",
		state: "",
		zipcode: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	const createAddress = useCreateAddress();

	const line1Id = useId();
	const line2Id = useId();
	const cityId = useId();
	const stateId = useId();
	const zipcodeId = useId();
	const recipientId = useId();
	const phoneId = useId();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		const newErrors: Record<string, string> = {};
		if (!formData.recipient_name.trim())
			newErrors.recipient_name = "Recipient name is required";
		if (!formData.phone.trim()) newErrors.phone = "Phone is required";
		if (!formData.address_line1.trim())
			newErrors.address_line1 = "Address is required";

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		try {
			const result = await createAddress.mutateAsync({
				customerId,
				addressData: formData,
			});

			// Reset form
			setFormData({
				recipient_name: "",
				phone: "",
				address_line1: "",
				address_line2: "",
				city: "",
				state: "",
				zipcode: "",
			});
			setErrors({});

			onSuccess(result.id);
		} catch (error) {
			console.error("Failed to create address:", error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Add Delivery Address</DialogTitle>
					<DialogDescription>
						Enter the delivery address for this order
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Recipient Name */}
						<div className="space-y-2">
							<Label htmlFor={recipientId}>Recipient Name *</Label>
							<Input
								id={recipientId}
								value={formData.recipient_name}
								onChange={(e) =>
									setFormData({ ...formData, recipient_name: e.target.value })
								}
							/>
							{errors.recipient_name && (
								<p className="text-red-500 text-sm">{errors.recipient_name}</p>
							)}
						</div>

						{/* Phone */}
						<div className="space-y-2">
							<Label htmlFor={phoneId}>Phone *</Label>
							<Input
								id={phoneId}
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
							/>
							{errors.phone && (
								<p className="text-red-500 text-sm">{errors.phone}</p>
							)}
						</div>

						{/* Address Line 1 */}
						<div className="space-y-2">
							<Label htmlFor={line1Id}>Address Line 1 *</Label>
							<Input
								id={line1Id}
								value={formData.address_line1}
								onChange={(e) =>
									setFormData({ ...formData, address_line1: e.target.value })
								}
							/>
							{errors.address_line1 && (
								<p className="text-red-500 text-sm">{errors.address_line1}</p>
							)}
						</div>

						{/* Address Line 2 */}
						<div className="space-y-2">
							<Label htmlFor={line2Id}>Address Line 2</Label>
							<Input
								id={line2Id}
								value={formData.address_line2}
								onChange={(e) =>
									setFormData({ ...formData, address_line2: e.target.value })
								}
							/>
						</div>

						{/* City, State, Zipcode */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-2">
								<Label htmlFor={cityId}>City</Label>
								<Input
									id={cityId}
									value={formData.city}
									onChange={(e) =>
										setFormData({ ...formData, city: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={stateId}>State</Label>
								<Input
									id={stateId}
									value={formData.state}
									onChange={(e) =>
										setFormData({ ...formData, state: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={zipcodeId}>Zipcode</Label>
								<Input
									id={zipcodeId}
									value={formData.zipcode}
									onChange={(e) =>
										setFormData({ ...formData, zipcode: e.target.value })
									}
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={createAddress.isPending}>
							{createAddress.isPending ? "Adding..." : "Add Address"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
