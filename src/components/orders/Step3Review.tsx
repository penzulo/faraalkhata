import {
	Calendar,
	MapPin,
	Package,
	Percent,
	StickyNote,
	Truck,
	User,
} from "lucide-react";
import { memo, useCallback, useId, useMemo } from "react";
import { useBoolean } from "usehooks-ts";
import { DeliveryAddressForm } from "@/components/orders/DeliveryAddressForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { UseOrderFormReturn } from "@/hooks/useOrderForm";
import { useCustomerAddresses } from "@/hooks/useOrders";
import { customerUtils } from "@/lib/api/customers";
import { orderUtils } from "@/lib/api/orders";
import type { CustomerWithCategories } from "@/types/customer";
import type { ProductWithCurrentPrice } from "@/types/product";

interface Step3ReviewProps {
	form: UseOrderFormReturn["form"];
	customers: readonly CustomerWithCategories[];
	products: readonly ProductWithCurrentPrice[];
	orderCalculations: UseOrderFormReturn["orderCalculations"];
}

interface OrderItemWithProduct {
	productId: string;
	product: ProductWithCurrentPrice;
	quantity: number;
	subtotal: number;
}

const CustomerSummaryCard = memo<{ customer: CustomerWithCategories }>(
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
			<Card className="p-4">
				<div className="mb-3 flex items-center gap-2">
					<User className="h-4 w-4 text-muted-foreground" />
					<h4 className="font-medium text-foreground text-sm">Customer</h4>
				</div>
				<div className="flex items-center gap-3">
					<div
						className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm text-white shadow-sm"
						style={{ backgroundColor: avatarColor }}
						aria-hidden="true"
					>
						{initials}
					</div>
					<div>
						<div className="font-medium text-foreground">{customer.name}</div>
						<div className="text-muted-foreground text-sm">
							{formattedPhone}
						</div>
					</div>
				</div>
			</Card>
		);
	},
);

CustomerSummaryCard.displayName = "CustomerSummaryCard";

const ProductLineItem = memo<{ item: OrderItemWithProduct }>(({ item }) => (
	<div className="flex justify-between text-sm">
		<div>
			<span className="font-medium text-foreground">{item.product.name}</span>
			<span className="ml-2 text-muted-foreground">
				× {item.quantity} {item.product.unit_of_measure}
			</span>
		</div>
		<span className="font-medium text-foreground">
			{orderUtils.formatCurrency(item.subtotal)}
		</span>
	</div>
));

ProductLineItem.displayName = "ProductLineItem";

const ProductsSummaryCard = memo<{ items: readonly OrderItemWithProduct[] }>(
	({ items }) => (
		<Card className="p-4">
			<div className="mb-3 flex items-center gap-2">
				<Package className="h-4 w-4 text-muted-foreground" />
				<h4 className="font-medium text-foreground text-sm">
					Products ({items.length})
				</h4>
			</div>
			<div className="space-y-2">
				{items.map((item) => (
					<ProductLineItem key={item.productId} item={item} />
				))}
			</div>
		</Card>
	),
);

ProductsSummaryCard.displayName = "ProductSummaryCard";

const OrderSummaryCard = memo<{
	calculations: UseOrderFormReturn["orderCalculations"];
}>(({ calculations }) => (
	<Card className="bg-muted/50 p-4">
		<h4 className="mb-3 font-semibold text-foreground">Order Summary</h4>
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span className="text-muted-foreground">Subtotal</span>
				<span className="text-foreground">
					{orderUtils.formatCurrency(calculations.subtotal)}
				</span>
			</div>
			{calculations.discount > 0 && (
				<div className="flex justify-between text-green-600 text-sm dark:text-green-400">
					<span>Discount</span>
					<span>-{orderUtils.formatCurrency(calculations.discount)}</span>
				</div>
			)}
			{calculations.deliveryFee > 0 && (
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">Delivery Fee</span>
					<span className="text-foreground">
						{orderUtils.formatCurrency(calculations.deliveryFee)}
					</span>
				</div>
			)}
			<Separator className="my-2" />
			<div className="flex items-center justify-between">
				<span className="font-semibold text-foreground text-lg">Total</span>
				<span className="font-bold text-primary text-xl">
					{orderUtils.formatCurrency(calculations.total)}
				</span>
			</div>
		</div>
	</Card>
));

OrderSummaryCard.displayName = "OrderSummaryCard";

export function Step3Review({
	form,
	customers,
	products,
	orderCalculations,
}: Step3ReviewProps) {
	const {
		value: showAddressForm,
		setTrue: openAddressForm,
		setFalse: closeAddressForm,
	} = useBoolean();

	const dueDateId = useId();
	const discountId = useId();
	const deliveryFeeId = useId();
	const notesId = useId();
	const checkBoxId = useId();

	const selectedCustomer = useMemo(
		() => customers.find((c) => c.id === form.state.values.customer_id),
		[customers, form.state.values.customer_id],
	);

	const { data: customerAddresses = [] } = useCustomerAddresses(
		selectedCustomer?.id ?? "",
	);

	const orderItems = useMemo((): OrderItemWithProduct[] => {
		const items = form.state.values.items ?? [];

		return items
			.map((item) => {
				const product = products.find((p) => p.id === item.product_id);
				if (!product) return null;

				return {
					productId: item.product_id,
					product,
					quantity: item.quantity,
					subtotal: product.sell_price * item.quantity,
				};
			})
			.filter((item): item is OrderItemWithProduct => item !== null);
	}, [form.state.values.items, products]);

	const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

	const handleAddressChange = useCallback(
		(value: string) =>
			form.setFieldValue("delivery_address_id", value === "none" ? "" : value),
		[form],
	);

	const handleDeliveryFeeChange = useCallback(
		(value: string) =>
			form.setFieldValue("delivery_fee", Number.parseFloat(value) || 0),
		[form],
	);

	const handleDiscountChange = useCallback(
		(value: string) => {
			const discount = Number.parseFloat(value) || 0;
			const maxDiscount = orderCalculations.subtotal;
			form.setFieldValue("discount_amount", Math.min(discount, maxDiscount));
		},
		[form, orderCalculations.subtotal],
	);

	const handleAddressSuccess = useCallback(
		(addressId: string) => {
			form.setFieldValue("delivery_address_id", addressId);
			closeAddressForm();
		},
		[form, closeAddressForm],
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<header>
				<h3 className="mb-1 font-semibold text-foreground text-lg">
					Review & Confirm
				</h3>
				<p className="text-muted-foreground text-sm">
					Review order details and add final information
				</p>
			</header>

			{/* Customer Summary */}
			{selectedCustomer && <CustomerSummaryCard customer={selectedCustomer} />}

			{/* Products Summary */}
			{orderItems.length > 0 && <ProductsSummaryCard items={orderItems} />}

			{/* Delivery Options */}
			<Card className="p-4">
				<div className="mb-3 flex items-center gap-2">
					<Truck className="h-4 w-4 text-muted-foreground" />
					<h4 className="font-medium text-foreground text-sm">Delivery</h4>
				</div>

				<form.Field name="needs_delivery">
					{(field) => (
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<Checkbox
									id={checkBoxId}
									checked={field.state.value}
									onCheckedChange={(checked) => {
										field.handleChange(checked === true);
									}}
								/>
								<Label
									htmlFor={checkBoxId}
									className="cursor-pointer text-foreground"
								>
									This order needs delivery
								</Label>
							</div>

							{field.state.value && (
								<div className="space-y-3 pl-6">
									{/* Address Selection */}
									<form.Field name="delivery_address_id">
										{(addressField) => (
											<div className="space-y-2">
												<Label className="text-foreground">
													Delivery Address{" "}
													<span className="text-destructive">*</span>
												</Label>
												{customerAddresses && customerAddresses.length > 0 ? (
													<Select
														value={addressField.state.value || "none"}
														onValueChange={handleAddressChange}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select delivery address" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="none">
																Select an address
															</SelectItem>
															{customerAddresses.map((address) => (
																<SelectItem key={address.id} value={address.id}>
																	<div className="text-sm">
																		<div className="font-medium">
																			{address.recipient_name}
																		</div>
																		<div className="text-muted-foreground">
																			{address.address_line1}
																			{address.city && `, ${address.city}`}
																		</div>
																	</div>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : (
													<p className="text-muted-foreground text-sm">
														No saved addresses for this customer
													</p>
												)}
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={openAddressForm}
													className="w-full"
												>
													<MapPin className="mr-2 h-4 w-4" />
													Add New Address
												</Button>
											</div>
										)}
									</form.Field>

									{/* Delivery Fee */}
									<form.Field name="delivery_fee">
										{(feeField) => (
											<div className="space-y-2">
												<Label
													htmlFor={deliveryFeeId}
													className="text-foreground"
												>
													Delivery Fee
												</Label>
												<div className="relative">
													<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-muted-foreground">
														₹
													</span>
													<Input
														id={deliveryFeeId}
														type="number"
														step="1"
														min="0"
														placeholder="0"
														value={feeField.state.value}
														onChange={(e) =>
															handleDeliveryFeeChange(e.target.value)
														}
														className="pl-8"
													/>
												</div>
											</div>
										)}
									</form.Field>
								</div>
							)}
						</div>
					)}
				</form.Field>
			</Card>

			{/* Due Date */}
			<form.Field
				name="due_date"
				validators={{
					onChange: ({ value }) => {
						if (!value) return "Please select a pickup/delivery date";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={dueDateId} className="text-foreground">
							<Calendar className="mr-1 inline h-4 w-4" />
							Pickup/Delivery Date <span className="text-destructive">*</span>
						</Label>
						<Input
							id={dueDateId}
							type="date"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							min={minDate}
							aria-invalid={field.state.meta.errors.length > 0}
						/>
						{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 && (
								<p className="text-destructive text-sm" role="alert">
									{field.state.meta.errors[0]}
								</p>
							)}
					</div>
				)}
			</form.Field>

			{/* Discount */}
			<form.Field
				name="discount_amount"
				validators={{
					onChange: ({ value }) => {
						if (value < 0) return "Discount cannot be negative";
						if (value > orderCalculations.subtotal)
							return "Discount cannot exceed subtotal";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={discountId} className="text-foreground">
							<Percent className="mr-1 inline h-4 w-4" />
							Discount{" "}
							<span className="font-normal text-muted-foreground text-xs">
								(Optional)
							</span>
						</Label>
						<div className="relative">
							<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-muted-foreground">
								₹
							</span>
							<Input
								id={discountId}
								type="number"
								step="1"
								min="0"
								max={orderCalculations.subtotal}
								placeholder="0"
								value={field.state.value}
								onChange={(e) => handleDiscountChange(e.target.value)}
								className="pl-8"
								aria-invalid={field.state.meta.errors.length > 0}
							/>
						</div>
						{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 && (
								<p className="text-destructive text-sm" role="alert">
									{field.state.meta.errors[0]}
								</p>
							)}
					</div>
				)}
			</form.Field>

			{/* Notes */}
			<form.Field name="notes">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={notesId} className="text-foreground">
							<StickyNote className="mr-1 inline h-4 w-4" />
							Order Notes{" "}
							<span className="font-normal text-muted-foreground text-xs">
								(Optional)
							</span>
						</Label>
						<Textarea
							id={notesId}
							placeholder="Add any special instructions or notes..."
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							rows={3}
							maxLength={1000}
							aria-label="Order notes"
						/>
						<p className="text-muted-foreground text-xs">
							{field.state.value?.length || 0}/1000 characters
						</p>
					</div>
				)}
			</form.Field>

			{/* Final Summary */}
			<OrderSummaryCard calculations={orderCalculations} />

			{/* Delivery Address Form Modal */}
			{selectedCustomer && (
				<DeliveryAddressForm
					isOpen={showAddressForm}
					onClose={closeAddressForm}
					customerId={selectedCustomer.id}
					onSuccess={handleAddressSuccess}
				/>
			)}
		</div>
	);
}
