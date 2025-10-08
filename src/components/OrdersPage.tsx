import { Filter, Plus, Search, ShoppingCart } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useBoolean, useMediaQuery } from "usehooks-ts";
import { OrderCard } from "@/components/OrderCard";
import { OrderForm } from "@/components/OrderForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useOrders } from "@/hooks/useOrders";
import type { OrderStatus, OrderWithRelations } from "@/types/order";

export function OrdersPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([
		"pending",
		"ready_for_pickup",
	]);
	const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(
		null,
	);

	const {
		value: showForm,
		setTrue: openForm,
		setFalse: closeForm,
	} = useBoolean();

	const isMobile = useMediaQuery("(max-width: 767px)");
	const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

	// Fetch orders with filters
	const {
		data: orders,
		isLoading,
		error,
	} = useOrders({
		status: statusFilter,
	});

	// Filter orders based on search (client-side for now)
	const filteredOrders = useMemo(() => {
		if (!orders) return [];
		if (!searchQuery.trim()) return orders;

		const query = searchQuery.toLowerCase();
		return orders.filter(
			(order) =>
				order.display_id.toLowerCase().includes(query) ||
				order.customer.name.toLowerCase().includes(query),
		);
	}, [orders, searchQuery]);

	// Device-specific grid columns
	const gridCols = useMemo(() => {
		if (isMobile) return "grid-cols-1";
		if (isTablet) return "grid-cols-2";
		return "grid-cols-3";
	}, [isMobile, isTablet]);

	// Event handlers
	const handleAddOrder = useCallback(() => {
		setSelectedOrder(null);
		openForm();
	}, [openForm]);

	const handleEditOrder = useCallback(
		(order: OrderWithRelations) => {
			setSelectedOrder(order);
			openForm();
		},
		[openForm],
	);

	const handleViewOrder = useCallback(
		(order: OrderWithRelations) => {
			// For now, just edit. Later we can add a dedicated view mode
			setSelectedOrder(order);
			openForm();
		},
		[openForm],
	);

	const handleCancelOrder = useCallback((_order: OrderWithRelations) => {
		// This will be handled by OrderCard's cancel dialog
	}, []);

	const handleCloseForm = useCallback(() => {
		setSelectedOrder(null);
		closeForm();
	}, [closeForm]);

	// Status filter options
	const statusOptions = [
		{ value: "all", label: "All Orders" },
		{ value: "pending", label: "Pending" },
		{ value: "ready_for_pickup", label: "Ready for Pickup" },
		{ value: "completed", label: "Completed" },
		{ value: "cancelled", label: "Cancelled" },
	];

	const handleStatusFilterChange = (value: string) => {
		if (value === "all") {
			setStatusFilter([
				"pending",
				"ready_for_pickup",
				"completed",
				"cancelled",
			]);
		} else {
			setStatusFilter([value as OrderStatus]);
		}
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="text-center">
					<ShoppingCart className="mx-auto mb-2 h-8 w-8 text-gray-400" />
					<p className="text-gray-500">Loading orders...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="text-center">
					<p className="mb-2 text-red-600">Failed to load orders</p>
					<p className="text-gray-500 text-sm">
						{error instanceof Error ? error.message : "Something went wrong"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div
				className={`flex ${isMobile ? "flex-col gap-4" : "flex-row items-center justify-between"}`}
			>
				<div className={isMobile ? "text-center" : ""}>
					<h1 className="font-bold text-2xl text-gray-900">Orders</h1>
					<p className="text-gray-600">
						Manage your faraal orders and track their status{" "}
						{orders && (
							<span className="text-gray-500 text-sm">
								({orders.length} {orders.length === 1 ? "order" : "orders"})
							</span>
						)}
					</p>
				</div>

				<Button
					onClick={handleAddOrder}
					className={isMobile ? "w-full" : "w-auto"}
				>
					<Plus className="mr-2 h-4 w-4" />
					Create Order
				</Button>
			</div>

			{/* Search and Filter Section */}
			<div className={`flex gap-3 ${isMobile ? "flex-col" : "flex-row"}`}>
				{/* Search Bar */}
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
					<Input
						placeholder={
							isMobile
								? "Search orders..."
								: "Search by order ID or customer name..."
						}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Status Filter */}
				<Select
					value={
						statusFilter.length === 4
							? "all"
							: statusFilter.length === 2 &&
									statusFilter.includes("pending") &&
									statusFilter.includes("ready_for_pickup")
								? "pending,ready_for_pickup"
								: statusFilter[0]
					}
					onValueChange={handleStatusFilterChange}
				>
					<SelectTrigger className={isMobile ? "w-full" : "w-[200px]"}>
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Orders</SelectItem>
						<SelectItem value="pending,ready_for_pickup">
							Active Orders
						</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
						<SelectItem value="cancelled">Cancelled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Status Summary Badges */}
			{orders && orders.length > 0 && (
				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">Total: {orders.length}</Badge>
					<Badge
						variant="outline"
						className="border-orange-200 text-orange-600"
					>
						Pending: {orders.filter((o) => o.status === "pending").length}
					</Badge>
					<Badge
						variant="outline"
						className="border-yellow-200 text-yellow-600"
					>
						Ready:{" "}
						{orders.filter((o) => o.status === "ready_for_pickup").length}
					</Badge>
					<Badge variant="outline" className="border-green-200 text-green-600">
						Completed: {orders.filter((o) => o.status === "completed").length}
					</Badge>
				</div>
			)}

			{/* Orders Grid */}
			{filteredOrders.length > 0 ? (
				<div className={`grid gap-4 ${gridCols}`}>
					{filteredOrders.map((order) => (
						<OrderCard
							key={order.id}
							order={order}
							onEdit={handleEditOrder}
							onView={handleViewOrder}
							onCancel={handleCancelOrder}
						/>
					))}
				</div>
			) : (
				<div className="py-12 text-center">
					<ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-400" />
					{searchQuery ? (
						<>
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								No orders found
							</h3>
							<p className="mb-4 text-gray-500">
								Try adjusting your search or filters.
							</p>
						</>
					) : (
						<>
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								No orders yet
							</h3>
							<p className="mb-4 text-gray-500">
								Start taking orders by creating your first order.
							</p>
						</>
					)}
					<Button onClick={handleAddOrder}>
						<Plus className="mr-2 h-4 w-4" />
						Create Your First Order
					</Button>
				</div>
			)}

			{/* Order Form */}
			<OrderForm
				isOpen={showForm}
				onClose={handleCloseForm}
				editOrder={selectedOrder}
			/>
		</div>
	);
}
