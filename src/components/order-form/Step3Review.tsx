import {
	Calendar,
	MapPin,
	Package,
	Percent,
	StickyNote,
	Truck,
	User,
} from "lucide-react";
import { useId, useMemo } from "react";
import { useBoolean } from "usehooks-ts";
import { DeliveryAddressForm } from "@/components/order-form/DeliveryAddressForm";
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
import { useCustomerAddresses } from "@/hooks/useOrders";
import { customerUtils } from "@/lib/api/customers";
import { orderUtils } from "@/lib/api/orders";
import type { CustomerWithCategories } from "@/types/customer";
import type { ProductWithCurrentPrice } from "@/types/product";

interface Step3ReviewProps {
	form: any;
	customers: CustomerWithCategories[];
	products: ProductWithCurrentPrice[];
	orderCalculations: any;
}

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

	// Get selected customer
	const selectedCustomer = useMemo(() => {
		return customers.find((c) => c.id === form.state.values.customer_id);
	}, [customers, form.state.values.customer_id]);

	// Fetch customer addresses
	const { data: customerAddresses = [] } = useCustomerAddresses(
		form.state.values.customer_id || "",
	);

	// Get selected products
	const selectedItems = form.state.values.items || [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h3 className="mb-1 font-semibold text-lg">Review & Confirm</h3>
				<p className="text-gray-600 text-sm">
					Review order details and add final information
				</p>
			</div>

			{/* Customer Summary */}
			{selectedCustomer && (
				<Card className="p-4">
					<div className="mb-3 flex items-center gap-2">
						<User className="h-4 w-4 text-gray-600" />
						<h4 className="font-medium text-sm">Customer</h4>
					</div>
					<div className="flex items-center gap-3">
						<div
							className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm text-white"
							style={{
								backgroundColor: customerUtils.getAvatarColor(
									selectedCustomer.name,
								),
							}}
						>
							{customerUtils.getCustomerInitials(selectedCustomer.name)}
						</div>
						<div>
							<div className="font-medium">{selectedCustomer.name}</div>
							<div className="text-gray-600 text-sm">
								{customerUtils.formatPhoneNumber(selectedCustomer.phone)}
							</div>
						</div>
					</div>
				</Card>
			)}

			{/* Products Summary */}
			<Card className="p-4">
				<div className="mb-3 flex items-center gap-2">
					<Package className="h-4 w-4 text-gray-600" />
					<h4 className="font-medium text-sm">
						Products ({selectedItems.length})
					</h4>
				</div>
				<div className="space-y-2">
					{selectedItems.map((item: any) => {
						const product = products.find((p) => p.id === item.product_id);
						if (!product) return null;

						return (
							<div
								key={item.product_id}
								className="flex justify-between text-sm"
							>
								<div>
									<span className="font-medium">{product.name}</span>
									<span className="ml-2 text-gray-600">
										× {item.quantity} {product.unit_of_measure}
									</span>
								</div>
								<span className="font-medium">
									{orderUtils.formatCurrency(
										product.sell_price * item.quantity,
									)}
								</span>
							</div>
						);
					})}
				</div>
			</Card>

			{/* Delivery Options */}
			<Card className="p-4">
				<div className="mb-3 flex items-center gap-2">
					<Truck className="h-4 w-4 text-gray-600" />
					<h4 className="font-medium text-sm">Delivery</h4>
				</div>

				<form.Field name="needs_delivery">
					{(field: any) => (
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<Checkbox
									id={checkBoxId}
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
								<Label htmlFor={checkBoxId} className="cursor-pointer">
									This order needs delivery
								</Label>
							</div>

							{field.state.value && (
								<div className="space-y-3 pl-6">
									{/* Address Selection */}
									<form.Field name="delivery_address_id">
										{(addressField: any) => (
											<div className="space-y-2">
												<Label>Delivery Address *</Label>
												{customerAddresses.length > 0 ? (
													<Select
														value={addressField.state.value}
														onValueChange={addressField.handleChange}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select delivery address" />
														</SelectTrigger>
														<SelectContent>
															{customerAddresses.map((address) => (
																<SelectItem key={address.id} value={address.id}>
																	<div className="text-sm">
																		<div className="font-medium">
																			{address.recipient_name}
																		</div>
																		<div className="text-gray-600">
																			{address.address_line1}
																			{address.city && `, ${address.city}`}
																		</div>
																	</div>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : (
													<p className="text-gray-500 text-sm">
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
										{(feeField: any) => (
											<div className="space-y-2">
												<Label htmlFor={deliveryFeeId}>Delivery Fee</Label>
												<div className="relative">
													<span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
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
															feeField.handleChange(
																Number.parseFloat(e.target.value) || 0,
															)
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
			<form.Field name="due_date">
				{(field: any) => (
					<div className="space-y-2">
						<Label htmlFor={dueDateId}>
							<Calendar className="mr-1 inline h-4 w-4" />
							Pickup/Delivery Date *
						</Label>
						<Input
							id={dueDateId}
							type="date"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							min={new Date().toISOString().split("T")[0]}
						/>
						{field.state.meta.errors.length > 0 && (
							<p className="text-red-500 text-sm">
								{field.state.meta.errors[0]}
							</p>
						)}
					</div>
				)}
			</form.Field>

			{/* Discount */}
			<form.Field name="discount_amount">
				{(field: any) => (
					<div className="space-y-2">
						<Label htmlFor={discountId}>
							<Percent className="mr-1 inline h-4 w-4" />
							Discount (Optional)
						</Label>
						<div className="relative">
							<span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
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
								onChange={(e) =>
									field.handleChange(Number.parseFloat(e.target.value) || 0)
								}
								className="pl-8"
							/>
						</div>
					</div>
				)}
			</form.Field>

			{/* Notes */}
			<form.Field name="notes">
				{(field: any) => (
					<div className="space-y-2">
						<Label htmlFor={notesId}>
							<StickyNote className="mr-1 inline h-4 w-4" />
							Order Notes (Optional)
						</Label>
						<Textarea
							id={notesId}
							placeholder="Add any special instructions or notes..."
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							rows={3}
						/>
					</div>
				)}
			</form.Field>

			{/* Final Summary */}
			<Card className="bg-gray-50 p-4">
				<h4 className="mb-3 font-semibold">Order Summary</h4>
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-gray-600">Subtotal</span>
						<span>{orderUtils.formatCurrency(orderCalculations.subtotal)}</span>
					</div>
					{orderCalculations.discount > 0 && (
						<div className="flex justify-between text-green-600 text-sm">
							<span>Discount</span>
							<span>
								-{orderUtils.formatCurrency(orderCalculations.discount)}
							</span>
						</div>
					)}
					{orderCalculations.deliveryFee > 0 && (
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Delivery Fee</span>
							<span>
								{orderUtils.formatCurrency(orderCalculations.deliveryFee)}
							</span>
						</div>
					)}
					<Separator className="my-2" />
					<div className="flex items-center justify-between">
						<span className="font-semibold text-lg">Total</span>
						<span className="font-bold text-orange-600 text-xl">
							{orderUtils.formatCurrency(orderCalculations.total)}
						</span>
					</div>
				</div>
			</Card>

			{/* Delivery Address Form Modal */}
			{selectedCustomer && (
				<DeliveryAddressForm
					isOpen={showAddressForm}
					onClose={closeAddressForm}
					customerId={selectedCustomer.id}
					onSuccess={(addressId: string) => {
						form.setFieldValue("delivery_address_id", addressId);
						closeAddressForm();
					}}
				/>
			)}
		</div>
	);
}
