import { useQueryClient } from "@tanstack/react-query";
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
import { CUSTOMERS_QUERY_KEY, useCreateCustomer } from "@/hooks/useCustomers";
import { customerUtils } from "@/lib/api/customers";

interface CustomerQuickAddProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (customerId: string) => void;
}

export function CustomerQuickAdd({
	isOpen,
	onClose,
	onSuccess,
}: CustomerQuickAddProps) {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

	const queryClient = useQueryClient();
	const createCustomer = useCreateCustomer();
	const nameId = useId();
	const phoneId = useId();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const newErrors: { name?: string; phone?: string } = {};
		if (!name.trim()) newErrors.name = "Name is required";
		if (!phone.trim()) {
			newErrors.phone = "Phone is required";
		} else if (!customerUtils.isValidIndianPhone(phone)) {
			newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		try {
			const result = await createCustomer.mutateAsync({
				name,
				phone: customerUtils.cleanPhoneNumber(phone),
				category_ids: [],
			});

			await queryClient.refetchQueries({ queryKey: CUSTOMERS_QUERY_KEY });

			setName("");
			setPhone("");
			setErrors({});

			onSuccess(result.id);
		} catch (error) {
			console.error("Failed to create customer:", error);
		}
	};

	const handlePhoneChange = (value: string) => {
		const cleaned = value.replace(/\D/g, "").slice(0, 10);
		setPhone(cleaned);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Customer</DialogTitle>
					<DialogDescription>
						Quickly add a customer with just name and phone
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor={nameId}>Customer Name *</Label>
							<Input
								id={nameId}
								placeholder="Enter customer name"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
							{errors.name && (
								<p className="text-red-500 text-sm">{errors.name}</p>
							)}
						</div>

						{/* Phone */}
						<div className="space-y-2">
							<Label htmlFor={phoneId}>Phone Number *</Label>
							<div className="relative">
								<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<span className="text-gray-500 text-sm">+91</span>
								</div>
								<Input
									id={phoneId}
									type="tel"
									placeholder="98765 43210"
									value={phone}
									onChange={(e) => handlePhoneChange(e.target.value)}
									className="pl-12"
									maxLength={10}
								/>
							</div>
							{errors.phone && (
								<p className="text-red-500 text-sm">{errors.phone}</p>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={createCustomer.isPending}>
							{createCustomer.isPending ? "Adding..." : "Add Customer"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
