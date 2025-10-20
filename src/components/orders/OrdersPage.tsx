import {
	AlertCircle,
	Calendar,
	Filter,
	MoreHorizontal,
	Plus,
	Search,
	ShoppingCart,
	User,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { useBoolean } from "usehooks-ts";
import { OrderForm } from "@/components/orders/OrderForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/hooks/useOrders";
import { orderUtils } from "@/lib/api/orders";
import type { OrderStatus, OrderWithRelations } from "@/types/order";

// Type-safe status filter options
const STATUS_FILTERS = [
	{
		value: "all",
		label: "All Orders",
		statuses: [
			"pending",
			"ready_for_pickup",
			"completed",
			"cancelled",
		] as OrderStatus[],
	},
	{
		value: "active",
		label: "Active Orders",
		statuses: ["pending", "ready_for_pickup"] as OrderStatus[],
	},
	{
		value: "pending",
		label: "Pending",
		statuses: ["pending"] as OrderStatus[],
	},
	{
		value: "ready_for_pickup",
		label: "Ready for Pickup",
		statuses: ["ready_for_pickup"] as OrderStatus[],
	},
	{
		value: "completed",
		label: "Completed",
		statuses: ["completed"] as OrderStatus[],
	},
	{
		value: "cancelled",
		label: "Cancelled",
		statuses: ["cancelled"] as OrderStatus[],
	},
] as const;

type FilterValue = (typeof STATUS_FILTERS)[number]["value"];

// Type-safe order metrics
interface OrderMetrics {
	total: number;
	pending: number;
	ready: number;
	completed: number;
	cancelled: number;
}

// Pure function to calculate order metrics
const calculateOrderMetrics = (
	orders: readonly OrderWithRelations[],
): OrderMetrics => {
	return {
		total: orders.length,
		pending: orders.filter((o) => o.status === "pending").length,
		ready: orders.filter((o) => o.status === "ready_for_pickup").length,
		completed: orders.filter((o) => o.status === "completed").length,
		cancelled: orders.filter((o) => o.status === "cancelled").length,
	};
};

// Memoized status badge component
const StatusBadge = memo<{ status: OrderStatus }>(({ status }) => {
	const config = useMemo(() => {
		switch (status) {
			case "pending":
				return {
					variant: "secondary" as const,
					className:
						"bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
					label: "Pending",
				};
			case "ready_for_pickup":
				return {
					variant: "secondary" as const,
					className:
						"bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400",
					label: "Ready",
				};
			case "completed":
				return {
					variant: "secondary" as const,
					className:
						"bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
					label: "Completed",
				};
			case "cancelled":
				return {
					variant: "secondary" as const,
					className:
						"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
					label: "Cancelled",
				};
			default:
				return {
					variant: "secondary" as const,
					className: "",
					label: status,
				};
		}
	}, [status]);

	return (
		<Badge variant={config.variant} className={config.className}>
			{config.label}
		</Badge>
	);
});

StatusBadge.displayName = "StatusBadge";

// Memoized order row component
const OrderRow = memo<{
	order: OrderWithRelations;
	onEdit: (order: OrderWithRelations) => void;
	onView: (order: OrderWithRelations) => void;
}>(
	({ order, onEdit, onView }) => {
		const formattedDate = useMemo(
			() =>
				new Date(order.due_date).toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
					year: "numeric",
				}),
			[order.due_date],
		);

		const itemCount = useMemo(
			() => order.order_items.length,
			[order.order_items.length],
		);

		return (
			<TableRow className="hover:bg-muted/50">
				<TableCell className="font-medium">
					<div className="flex items-center gap-2">
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						<span className="text-foreground">{order.display_id}</span>
					</div>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						<User className="h-4 w-4 text-muted-foreground" />
						<span className="text-foreground">{order.customer.name}</span>
					</div>
				</TableCell>
				<TableCell>
					<StatusBadge status={order.status} />
				</TableCell>
				<TableCell>
					<span className="text-muted-foreground text-sm">
						{itemCount} {itemCount === 1 ? "item" : "items"}
					</span>
				</TableCell>
				<TableCell>
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<span className="text-foreground">{formattedDate}</span>
					</div>
				</TableCell>
				<TableCell>
					<span className="font-semibold text-foreground">
						{orderUtils.formatCurrency(order.total_amount)}
					</span>
				</TableCell>
				<TableCell className="text-right">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Order actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onView(order)}>
								View Details
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onEdit(order)}>
								Edit Order
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-destructive">
								Cancel Order
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</TableCell>
			</TableRow>
		);
	},
	(prev, next) =>
		prev.order.id === next.order.id &&
		prev.order.status === next.order.status &&
		prev.order.total_amount === next.order.total_amount,
);

OrderRow.displayName = "OrderRow";

// Memoized loading skeleton
const TableSkeleton = memo(() => (
	<div className="rounded-md border">
		<Table>
			<TableHeader>
				<TableRow className="bg-muted/50 hover:bg-muted/50">
					<TableHead>Order ID</TableHead>
					<TableHead>Customer</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Items</TableHead>
					<TableHead>Due Date</TableHead>
					<TableHead>Total</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: 5 }, (_, k) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Only used for skeleton
					<TableRow key={k}>
						<TableCell>
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded" />
								<Skeleton className="h-4 w-20" />
							</div>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded" />
								<Skeleton className="h-4 w-32" />
							</div>
						</TableCell>
						<TableCell>
							<Skeleton className="h-5 w-16 rounded-full" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-12" />
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded" />
								<Skeleton className="h-4 w-20" />
							</div>
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-16" />
						</TableCell>
						<TableCell className="text-right">
							<Skeleton className="ml-auto h-8 w-8 rounded" />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	</div>
));

TableSkeleton.displayName = "TableSkeleton";

// Memoized empty state
const EmptyState = memo<{
	hasSearchQuery: boolean;
	onAddOrder: () => void;
}>(({ hasSearchQuery, onAddOrder }) => (
	<div className="flex flex-col items-center justify-center rounded-md border bg-card py-12">
		<ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/40" />
		{hasSearchQuery ? (
			<>
				<h3 className="mb-2 font-medium text-foreground text-lg">
					No orders found
				</h3>
				<p className="mb-4 text-center text-muted-foreground">
					Try adjusting your search or filters
				</p>
			</>
		) : (
			<>
				<h3 className="mb-2 font-medium text-foreground text-lg">
					No orders yet
				</h3>
				<p className="mb-4 text-center text-muted-foreground">
					Start taking orders by creating your first order
				</p>
				<Button onClick={onAddOrder}>
					<Plus className="mr-2 h-4 w-4" />
					Create Your First Order
				</Button>
			</>
		)}
	</div>
));

EmptyState.displayName = "EmptyState";

// Memoized error state
const ErrorState = memo<{ error: Error | unknown }>(({ error }) => (
	<div className="flex flex-col items-center justify-center rounded-md border bg-card py-12">
		<AlertCircle className="mb-4 h-12 w-12 text-destructive" />
		<h3 className="mb-2 font-medium text-foreground text-lg">
			Failed to load orders
		</h3>
		<p className="text-center text-muted-foreground">
			{error instanceof Error ? error.message : "Something went wrong"}
		</p>
	</div>
));

ErrorState.displayName = "ErrorState";

export function OrdersPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filterValue, setFilterValue] = useState<FilterValue>("active");
	const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(
		null,
	);

	const {
		value: showForm,
		setTrue: openForm,
		setFalse: closeForm,
	} = useBoolean();

	// Get current filter configuration
	const currentFilter = useMemo(
		() =>
			STATUS_FILTERS.find((f) => f.value === filterValue) ?? STATUS_FILTERS[1],
		[filterValue],
	);

	// Fetch orders with selected status filters
	const {
		data: orders,
		isLoading,
		error,
	} = useOrders({
		status: currentFilter.statuses,
	});

	// Client-side search filtering
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

	// Calculate order metrics
	const metrics = useMemo(
		() => (orders ? calculateOrderMetrics(orders) : null),
		[orders],
	);

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
			setSelectedOrder(order);
			openForm();
		},
		[openForm],
	);

	const handleCloseForm = useCallback(() => {
		setSelectedOrder(null);
		closeForm();
	}, [closeForm]);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
		[],
	);

	const handleFilterChange = useCallback((value: string) => {
		setFilterValue(value as FilterValue);
	}, []);

	// Loading state
	if (isLoading) {
		return (
			<div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
				<div>
					<Skeleton className="mb-2 h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<TableSkeleton />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
				<div>
					<h1 className="mb-2 font-bold text-2xl text-foreground">Orders</h1>
					<p className="text-muted-foreground">
						Manage your faraal orders and track their status
					</p>
				</div>
				<ErrorState error={error} />
			</div>
		);
	}

	const hasOrders = orders && orders.length > 0;
	const hasFilteredOrders = filteredOrders.length > 0;

	return (
		<div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
			{/* Header Section */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="mb-2 font-bold text-2xl text-foreground">Orders</h1>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
						<span>Manage your faraal orders and track their status</span>
						{hasOrders && metrics && (
							<span className="font-medium text-foreground text-sm">
								{metrics.total} {metrics.total === 1 ? "order" : "orders"}
							</span>
						)}
					</div>
				</div>

				<Button onClick={handleAddOrder} className="w-full sm:w-auto">
					<Plus className="mr-2 h-4 w-4" />
					Create Order
				</Button>
			</div>

			{/* Search and Filter Section */}
			<div className="flex flex-col gap-3 sm:flex-row">
				{/* Search Bar */}
				<div className="relative flex-1">
					<Search
						className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						placeholder="Search by order ID or customer name..."
						value={searchQuery}
						onChange={handleSearchChange}
						className="pl-10"
						aria-label="Search orders"
					/>
				</div>

				{/* Status Filter */}
				<Select value={filterValue} onValueChange={handleFilterChange}>
					<SelectTrigger className="w-full sm:w-[200px]">
						<Filter className="mr-2 h-4 w-4" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{STATUS_FILTERS.map((filter) => (
							<SelectItem key={filter.value} value={filter.value}>
								{filter.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Status Summary Badges */}
			{hasOrders && metrics && (
				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">Total: {metrics.total}</Badge>
					<Badge
						variant="outline"
						className="border-orange-200 text-orange-600 dark:border-orange-900/50 dark:text-orange-400"
					>
						Pending: {metrics.pending}
					</Badge>
					<Badge
						variant="outline"
						className="border-yellow-200 text-yellow-600 dark:border-yellow-900/50 dark:text-yellow-400"
					>
						Ready: {metrics.ready}
					</Badge>
					<Badge
						variant="outline"
						className="border-green-200 text-green-600 dark:border-green-900/50 dark:text-green-400"
					>
						Completed: {metrics.completed}
					</Badge>
				</div>
			)}

			{/* Orders Table */}
			{hasFilteredOrders ? (
				<div className="overflow-hidden rounded-md border">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50 hover:bg-muted/50">
								<TableHead className="font-semibold text-foreground">
									Order ID
								</TableHead>
								<TableHead className="font-semibold text-foreground">
									Customer
								</TableHead>
								<TableHead className="font-semibold text-foreground">
									Status
								</TableHead>
								<TableHead className="font-semibold text-foreground">
									Items
								</TableHead>
								<TableHead className="font-semibold text-foreground">
									Due Date
								</TableHead>
								<TableHead className="font-semibold text-foreground">
									Total
								</TableHead>
								<TableHead className="text-right font-semibold text-foreground">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredOrders.map((order) => (
								<OrderRow
									key={order.id}
									order={order}
									onEdit={handleEditOrder}
									onView={handleViewOrder}
								/>
							))}
						</TableBody>
					</Table>
				</div>
			) : (
				<EmptyState
					hasSearchQuery={Boolean(searchQuery)}
					onAddOrder={handleAddOrder}
				/>
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
