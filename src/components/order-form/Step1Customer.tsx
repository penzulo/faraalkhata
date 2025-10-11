import { Plus, Search, Users } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useBoolean } from "usehooks-ts";
import { CustomerQuickAdd } from "@/components/order-form/CustomerQuickAdd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { customerUtils } from "@/lib/api/customers";
import type { CustomerWithCategories } from "@/types/customer";
import type { ReferralPartner } from "@/types/order";

interface Step1CustomerProps {
	form: any;
	customers: CustomerWithCategories[];
	referralPartners: ReferralPartner[];
	validators: any;
}

export function Step1Customer({
	form,
	customers,
	referralPartners,
	validators,
}: Step1CustomerProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const {
		value: showQuickAdd,
		setTrue: openQuickAdd,
		setFalse: closeQuickAdd,
	} = useBoolean();

	const customerFieldId = useId();
	const referralFieldId = useId();

	// Filter customers based on search
	const filteredCustomers = useMemo(() => {
		if (!searchQuery.trim()) return customers;
		const query = searchQuery.toLowerCase();
		return customers.filter(
			(customer) =>
				customer.name.toLowerCase().includes(query) ||
				customer.phone.includes(query),
		);
	}, [customers, searchQuery]);

	// Get selected customer
	const selectedCustomer = useMemo(() => {
		return customers.find((c) => c.id === form.state.values.customer_id);
	}, [customers, form.state.values.customer_id]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h3 className="mb-1 font-semibold text-lg">Select Customer</h3>
				<p className="text-gray-600 text-sm">
					Choose a customer for this order or add a new one
				</p>
			</div>

			{/* Customer Selection */}
			<form.Field
				name="customer_id"
				validators={{
					onChange:
						validators?.customer_id ||
						(({ value }: any) => {
							if (!value) return "Please select a customer";
							return undefined;
						}),
				}}
			>
				{(field: any) => (
					<div className="space-y-2">
						<Label htmlFor={customerFieldId}>Customer *</Label>

						{/* Search bar */}
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
							<Input
								placeholder="Search customers by name or phone..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Customer list */}
						<div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
							{filteredCustomers.length > 0 ? (
								filteredCustomers.map((customer) => {
									const isSelected = field.state.value === customer.id;
									const initials = customerUtils.getCustomerInitials(
										customer.name,
									);
									const avatarColor = customerUtils.getAvatarColor(
										customer.name,
									);

									return (
										<button
											key={customer.id}
											type="button"
											onClick={() => {
												field.handleChange(customer.id);
												// Force validation after selection
												field.handleBlur();
											}}
											className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
												isSelected
													? "border-orange-500 bg-orange-50"
													: "border-gray-200 hover:border-gray-300"
											}`}
										>
											<div className="flex items-center gap-3">
												<div
													className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm text-white"
													style={{ backgroundColor: avatarColor }}
												>
													{initials}
												</div>
												<div className="min-w-0 flex-1">
													<div className="truncate font-medium">
														{customer.name}
													</div>
													<div className="text-gray-600 text-sm">
														{customerUtils.formatPhoneNumber(customer.phone)}
													</div>
													{customer.categories.length > 0 && (
														<div className="mt-1 flex gap-1">
															{customer.categories.slice(0, 2).map((cat) => (
																<Badge
																	key={cat.id}
																	variant="outline"
																	className="text-xs"
																>
																	{cat.name}
																</Badge>
															))}
														</div>
													)}
												</div>
											</div>
										</button>
									);
								})
							) : (
								<div className="py-8 text-center text-gray-500">
									<Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p className="text-sm">No customers found</p>
								</div>
							)}
						</div>

						{/* Quick Add Button */}
						<Button
							type="button"
							variant="outline"
							onClick={openQuickAdd}
							className="w-full"
						>
							<Plus className="mr-2 h-4 w-4" />
							Add New Customer
						</Button>

						{field.state.meta.errors.length > 0 && (
							<p className="text-red-500 text-sm">
								{field.state.meta.errors[0]}
							</p>
						)}
					</div>
				)}
			</form.Field>

			{/* Selected Customer Preview */}
			{selectedCustomer && (
				<Card className="border-blue-200 bg-blue-50 p-4">
					<div className="flex items-center gap-3">
						<div
							className="flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white"
							style={{
								backgroundColor: customerUtils.getAvatarColor(
									selectedCustomer.name,
								),
							}}
						>
							{customerUtils.getCustomerInitials(selectedCustomer.name)}
						</div>
						<div>
							<div className="font-semibold">{selectedCustomer.name}</div>
							<div className="text-gray-600 text-sm">
								{customerUtils.formatPhoneNumber(selectedCustomer.phone)}
							</div>
						</div>
					</div>
				</Card>
			)}

			{/* Referral Partner (Optional) */}
			<form.Field name="referral_partner_id">
				{(field: any) => (
					<div className="space-y-2">
						<Label htmlFor={referralFieldId}>Referral Partner (Optional)</Label>
						<Select
							value={field.state.value || "none"}
							onValueChange={(value) =>
								field.handleChange(value === "none" ? "" : value)
							}
						>
							<SelectTrigger id={referralFieldId}>
								<SelectValue placeholder="Select referral partner (if any)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								{referralPartners.map((partner) => (
									<SelectItem key={partner.id} value={partner.id}>
										<div className="flex w-full items-center justify-between">
											<span>{partner.name}</span>
											<Badge variant="secondary" className="ml-2">
												{partner.commission_type === "percent"
													? `${partner.commission_value}%`
													: `₹${partner.commission_value}`}
											</Badge>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-gray-500 text-xs">
							Select if this order came through a referral partner
						</p>
					</div>
				)}
			</form.Field>

			{/* Quick Add Modal */}
			<CustomerQuickAdd
				isOpen={showQuickAdd}
				onClose={closeQuickAdd}
				onSuccess={(customerId) => {
					form.setFieldValue("customer_id", customerId);
					// Force validation after setting value
					const field = form.getFieldMeta("customer_id");
					if (field) {
						form.validateField("customer_id");
					}
					closeQuickAdd();
				}}
			/>
		</div>
	);
}
