import {
	Calendar,
	Edit,
	Eye,
	MoreHorizontal,
	Phone,
	ShoppingCart,
	Truck,
	User,
	XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useBoolean } from "usehooks-ts";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCancelOrder } from "@/hooks/useOrders";
import { customerUtils } from "@/lib/api/customers";
import { orderUtils } from "@/lib/api/orders";
import type { OrderWithRelations } from "@/types/order";
import { CANCELLATION_REASONS } from "@/types/order";

interface OrderCardProps {
	order: OrderWithRelations;
	onEdit: (order: OrderWithRelations) => void;
	onView: (order: OrderWithRelations) => void;
	onCancel: (order: OrderWithRelations) => void;
}

export function OrderCard({ order, onEdit, onView }: OrderCardProps) {
	const {
		value: showCancelDialog,
		setTrue: openCancelDialog,
		setFalse: closeCancelDialog,
	} = useBoolean();

	const [cancelReason, setCancelReason] = useState("");
	const [cancelNotes, setCancelNotes] = useState("");

	const cancelOrder = useCancelOrder();

	// Order display data
	const orderData = useMemo(() => {
		const statusColors = orderUtils.getStatusColor(order.status);

		// Calculate payment status
		const totalPaid = order.order_payments.reduce(
			(sum, payment) => sum + payment.amount,
			0,
		);
		const balanceDue = order.total_amount - totalPaid;
		const isPaid = balanceDue <= 0;

		// Format due date
		const dueDate = new Date(order.due_date);
		const today = new Date();
		const isPastDue = dueDate < today && order.status !== "completed";

		const dueDateFormatted = dueDate.toLocaleDateString("en-IN", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

		// Get item count
		const itemCount = order.order_items.reduce(
			(sum, item) => sum + item.quantity,
			0,
		);

		return {
			statusColors,
			totalPaid,
			balanceDue,
			isPaid,
			isPastDue,
			dueDateFormatted,
			itemCount,
			hasDelivery: Boolean(order.delivery_address_id),
		};
	}, [order]);

	// Event handlers
	const handleEdit = useCallback(() => {
		onEdit(order);
	}, [onEdit, order]);

	const handleView = useCallback(() => {
		onView(order);
	}, [onView, order]);

	const handleCancelSubmit = useCallback(async () => {
		if (!cancelReason) return;

		await cancelOrder.mutateAsync({
			order_id: order.id,
			reason: cancelReason,
			notes: cancelNotes || undefined,
		});

		setCancelReason("");
		setCancelNotes("");
		closeCancelDialog();
	}, [cancelOrder, order.id, cancelReason, cancelNotes, closeCancelDialog]);

	const canEdit = order.status !== "completed" && order.status !== "cancelled";
	const canCancel =
		order.status !== "completed" && order.status !== "cancelled";

	return (
		<>
			<Card
				className={`transition-all hover:shadow-lg ${
					order.status === "cancelled" ? "opacity-60" : ""
				}`}
			>
				<CardContent className="p-4">
					<div className="space-y-3">
						{/* Header: Order ID & Status */}
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<div className="mb-1 flex items-center gap-2">
									<ShoppingCart className="h-4 w-4 text-gray-600" />
									<span className="font-semibold text-gray-900">
										{order.display_id}
									</span>
								</div>
								<Badge
									className={`${orderData.statusColors.bg} ${orderData.statusColors.text} ${orderData.statusColors.border} border`}
								>
									{order.status.replace("_", " ")}
								</Badge>
							</div>

							{/* Actions Menu */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={handleView}>
										<Eye className="mr-2 h-4 w-4" />
										View Details
									</DropdownMenuItem>
									{canEdit && (
										<DropdownMenuItem onClick={handleEdit}>
											<Edit className="mr-2 h-4 w-4" />
											Edit Order
										</DropdownMenuItem>
									)}
									{canCancel && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={openCancelDialog}
												className="text-red-600"
											>
												<XCircle className="mr-2 h-4 w-4" />
												Cancel Order
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Customer Info */}
						<div className="flex items-center gap-2">
							<div
								className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white text-xs"
								style={{
									backgroundColor: customerUtils.getAvatarColor(
										order.customer.name,
									),
								}}
							>
								{customerUtils.getCustomerInitials(order.customer.name)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="truncate font-medium text-sm">
									{order.customer.name}
								</div>
								<div className="flex items-center gap-1 text-gray-600 text-xs">
									<Phone className="h-3 w-3" />
									{customerUtils.formatPhoneNumber(order.customer.phone)}
								</div>
							</div>
						</div>

						{/* Order Details */}
						<div className="space-y-2 text-sm">
							{/* Due Date */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1 text-gray-600">
									<Calendar className="h-4 w-4" />
									<span>Due Date:</span>
								</div>
								<span
									className={`font-medium ${
										orderData.isPastDue ? "text-red-600" : "text-gray-900"
									}`}
								>
									{orderData.dueDateFormatted}
									{orderData.isPastDue && " (Overdue)"}
								</span>
							</div>

							{/* Delivery Badge */}
							{orderData.hasDelivery && (
								<div className="flex items-center gap-1 text-blue-600">
									<Truck className="h-4 w-4" />
									<span className="text-xs">Delivery Required</span>
								</div>
							)}

							{/* Items Count */}
							<div className="flex items-center justify-between text-gray-600">
								<span>Items:</span>
								<span className="font-medium">{orderData.itemCount}</span>
							</div>

							{/* Total Amount */}
							<div className="flex items-center justify-between border-t pt-2">
								<span className="font-semibold text-gray-900">Total:</span>
								<span className="font-bold text-lg text-orange-600">
									{orderUtils.formatCurrency(order.total_amount)}
								</span>
							</div>

							{/* Payment Status */}
							{!orderData.isPaid && order.status !== "cancelled" && (
								<div className="rounded border border-yellow-200 bg-yellow-50 p-2">
									<div className="flex items-center justify-between text-xs">
										<span className="text-yellow-700">Pending:</span>
										<span className="font-semibold text-yellow-800">
											{orderUtils.formatCurrency(orderData.balanceDue)}
										</span>
									</div>
								</div>
							)}

							{orderData.isPaid && order.status !== "cancelled" && (
								<div className="rounded border border-green-200 bg-green-50 p-2 text-center">
									<span className="font-medium text-green-700 text-xs">
										✓ Fully Paid
									</span>
								</div>
							)}
						</div>

						{/* Referral Badge */}
						{order.referral_partner && (
							<Badge variant="outline" className="text-xs">
								<User className="mr-1 h-3 w-3" />
								via {order.referral_partner.name}
							</Badge>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Cancel Order Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={closeCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Order</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel order {order.display_id}? Stock
							will be restored automatically.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="space-y-4 py-4">
						{/* Cancellation Reason */}
						<div className="space-y-2">
							<Label>Reason for Cancellation *</Label>
							<Select value={cancelReason} onValueChange={setCancelReason}>
								<SelectTrigger>
									<SelectValue placeholder="Select a reason" />
								</SelectTrigger>
								<SelectContent>
									{CANCELLATION_REASONS.map((reason) => (
										<SelectItem key={reason} value={reason}>
											{reason}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Additional Notes */}
						<div className="space-y-2">
							<Label>Additional Notes (Optional)</Label>
							<Textarea
								placeholder="Add any additional details..."
								value={cancelNotes}
								onChange={(e) => setCancelNotes(e.target.value)}
								rows={3}
							/>
						</div>
					</div>

					<AlertDialogFooter>
						<AlertDialogCancel>Keep Order</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelSubmit}
							disabled={!cancelReason || cancelOrder.isPending}
							className="bg-red-600 hover:bg-red-700"
						>
							{cancelOrder.isPending ? "Cancelling..." : "Cancel Order"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
