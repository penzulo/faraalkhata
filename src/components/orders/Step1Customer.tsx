import { Plus, Search, Users } from "lucide-react";
import { memo, useCallback, useId, useMemo, useState } from "react";
import { useBoolean } from "usehooks-ts";
import { CustomerQuickAdd } from "@/components/orders/CustomerQuickAdd";
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
import type { UseOrderFormReturn } from "@/hooks/useOrderForm";
import { customerUtils } from "@/lib/api/customers";
import type { CustomerWithCategories } from "@/types/customer";
import type { ReferralPartner } from "@/types/order";

interface Step1CustomerProps {
	form: UseOrderFormReturn["form"];
	customers: readonly CustomerWithCategories[];
	referralPartners: readonly ReferralPartner[];
}

interface CustomerCardProps {
	customer: CustomerWithCategories;
	isSelected: boolean;
	onSelect: (customerId: string) => void;
}

const CustomerCard = memo<CustomerCardProps>(
	({ customer, isSelected, onSelect }) => {
		const initials = useMemo(
			() => customerUtils.getCustomerInitials(customer.name),
			[customer.name],
		);

		const avatarColor = useMemo(
			() => customerUtils.getAvatarColor(customer.name),
			[customer.name],
		);

		const formattedPhone = useMemo(
			() => customerUtils.formatPhoneNumber(customer.phone),
			[customer.phone],
		);

		const handleClick = useCallback(() => {
			onSelect(customer.id);
		}, [customer.id, onSelect]);

		return (
			<button
				type="button"
				onClick={handleClick}
				className={`group w-full rounded-lg border-2 p-3 text-left transition-all duration-200 ${
					isSelected
						? "border-primary bg-primary/5"
						: "border-border hover:border-primary/50 hover:bg-muted/50"
				}`}
				aria-pressed={isSelected}
				aria-label={`Select ${customer.name}`}
			>
				<div className="flex items-center gap-3">
					{/* Avatar */}
					<div
						className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-semibold text-sm text-white shadow-sm transition-transform group-hover:scale-105"
						style={{ backgroundColor: avatarColor }}
						aria-hidden="true"
					>
						{initials}
					</div>

					{/* Customer Info */}
					<div className="min-w-0 flex-1">
						<div className="truncate font-medium text-foreground">
							{customer.name}
						</div>
						<div className="text-muted-foreground text-sm">
							{formattedPhone}
						</div>

						{/* Categories */}
						{customer.categories.length > 0 && (
							<div className="mt-1.5 flex flex-wrap gap-1">
								{customer.categories.slice(0, 2).map((cat) => (
									<Badge key={cat.id} variant="outline" className="text-xs">
										{cat.name}
									</Badge>
								))}
								{customer.categories.length > 2 && (
									<Badge variant="outline" className="text-xs">
										+{customer.categories.length - 2}
									</Badge>
								)}
							</div>
						)}
					</div>

					{/* Selection Indicator */}
					{isSelected && (
						<div
							className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary"
							aria-hidden="true"
						>
							<svg
								className="h-3 w-3 text-primary-foreground"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={3}
							>
								<title>Customer Selection Indicator</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					)}
				</div>
			</button>
		);
	},
);

CustomerCard.displayName = "CustomerCard";

const EmptyCustomerState = memo(() => (
	<div className="py-12 text-center">
		<Users className="mx-auto mb-3 h-16 w-16 text-muted-foreground/40" />
		<p className="font-medium text-muted-foreground text-sm">
			No customers found
		</p>
		<p className="mt-1 text-muted-foreground/70 text-xs">
			Try adjusting your search or add a new customer
		</p>
	</div>
));

EmptyCustomerState.displayName = "EmptyCustomerState";

const SelectedCustomerPreview = memo<{ customer: CustomerWithCategories }>(
	({ customer }) => {
		const initials = useMemo(
			() => customerUtils.getCustomerInitials(customer.name),
			[customer.name],
		);

		const avatarColor = useMemo(
			() => customerUtils.getAvatarColor(customer.name),
			[customer.name],
		);

		const formattedPhone = useMemo(
			() => customerUtils.formatPhoneNumber(customer.phone),
			[customer.phone],
		);

		return (
			<Card className="border-primary/30 bg-primary/5 p-4 shadow-sm">
				<div className="flex items-center gap-3">
					<div
						className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-md"
						style={{ backgroundColor: avatarColor }}
						aria-hidden="true"
					>
						{initials}
					</div>
					<div className="min-w-0 flex-1">
						<div className="truncate font-semibold text-foreground">
							{customer.name}
						</div>
						<div className="text-muted-foreground text-sm">
							{formattedPhone}
						</div>
						{customer.categories.length > 0 && (
							<div className="mt-1 flex flex-wrap gap-1">
								{customer.categories.map((cat) => (
									<Badge key={cat.id} variant="secondary" className="text-xs">
										{cat.name}
									</Badge>
								))}
							</div>
						)}
					</div>
				</div>
			</Card>
		);
	},
);

SelectedCustomerPreview.displayName = "SelectedCustomerPreview";

export function Step1Customer({
	form,
	customers,
	referralPartners,
}: Step1CustomerProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const {
		value: showQuickAdd,
		setTrue: openQuickAdd,
		setFalse: closeQuickAdd,
	} = useBoolean();

	const customerFieldId = useId();
	const referralFieldId = useId();
	const searchInputId = useId();

	const filteredCustomers = useMemo(() => {
		if (!searchQuery.trim()) return customers;

		const query = searchQuery.toLowerCase().trim();
		const terms = query.split(/\s+/);
		return customers.filter((customer) => {
			const searchableText = `${customer.name} ${customer.phone}`.toLowerCase();
			return terms.every((term) => searchableText.includes(term));
		});
	}, [customers, searchQuery]);

	const selectedCustomer = useMemo(
		() => customers.find((c) => c.id === form.state.values.customer_id),
		[customers, form.state.values.customer_id],
	);

	const activeReferralPartners = useMemo(
		() => referralPartners.filter((p) => p.is_active),
		[referralPartners],
	);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
		[],
	);

	const handleCustomerSelect = useCallback(
		(customerId: string) => {
			form.setFieldValue("customer_id", customerId);
			form.validateField("customer_id", "change");
		},
		[form],
	);

	const handleQuickAddSuccess = useCallback(
		(customerId: string) => {
			form.setFieldValue("customer_id", customerId);
			form.validateField("customer_id", "change");
			closeQuickAdd();
		},
		[form, closeQuickAdd],
	);

	const handleReferralChange = useCallback(
		(value: string) =>
			form.setFieldValue("referral_partner_id", value === "none" ? "" : value),
		[form],
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<header>
				<h3 className="mb-1 font-semibold text-foreground text-lg">
					Select Customer
				</h3>
				<p className="text-muted-foreground text-sm">
					Choose a customer for this order or add a new one
				</p>
			</header>

			{/* Customer Selection */}
			<form.Field
				name="customer_id"
				validators={{
					onChange: ({ value }) => {
						if (!value || value.trim() === "")
							return "Please select a customer";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-3">
						<Label htmlFor={customerFieldId} className="font-medium text-sm">
							Customer <span className="text-destructive">*</span>
						</Label>

						{/* Search Bar */}
						<div className="relative">
							<Search
								className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<Input
								id={searchInputId}
								type="search"
								placeholder="Search by name or phone..."
								value={searchQuery}
								onChange={handleSearchChange}
								className="pl-10"
								aria-label="Search customers"
								autoComplete="off"
							/>
						</div>

						{/* Customer List */}
						<div
							className="max-h-96 space-y-2 overflow-y-auto rounded-lg border bg-card p-2 shadow-sm"
							role="listbox"
							aria-label="Customer list"
						>
							{filteredCustomers.length > 0 ? (
								filteredCustomers.map((customer) => (
									<CustomerCard
										key={customer.id}
										customer={customer}
										isSelected={field.state.value === customer.id}
										onSelect={handleCustomerSelect}
									/>
								))
							) : (
								<EmptyCustomerState />
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

						{/* Validation Error */}
						{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 && (
								<p
									className="font-medium text-destructive text-sm"
									role="alert"
									aria-live="polite"
								>
									{field.state.meta.errors[0]}
								</p>
							)}
					</div>
				)}
			</form.Field>

			{/* Selected Customer Preview */}
			{selectedCustomer && (
				<SelectedCustomerPreview customer={selectedCustomer} />
			)}

			{/* Referral Partner Selection */}
			<form.Field name="referral_partner_id">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={referralFieldId} className="font-medium text-sm">
							Referral Partner{" "}
							<span className="font-normal text-muted-foreground text-xs">
								(Optional)
							</span>
						</Label>
						<Select
							value={field.state.value || "none"}
							onValueChange={handleReferralChange}
						>
							<SelectTrigger id={referralFieldId}>
								<SelectValue placeholder="Select referral partner (if any)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								{activeReferralPartners.map((partner) => (
									<SelectItem key={partner.id} value={partner.id}>
										<div className="flex w-full items-center justify-between gap-2">
											<span className="truncate">{partner.name}</span>
											<Badge variant="secondary" className="shrink-0 text-xs">
												{partner.commission_type === "percent"
													? `${partner.commission_value}%`
													: `₹${partner.commission_value}`}
											</Badge>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-xs">
							Select if this order came through a referral partner
						</p>
					</div>
				)}
			</form.Field>

			{/* Quick Add Modal */}
			<CustomerQuickAdd
				isOpen={showQuickAdd}
				onClose={closeQuickAdd}
				onSuccess={handleQuickAddSuccess}
			/>
		</div>
	);
}
