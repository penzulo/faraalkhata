import { Filter, MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { memo, useCallback, useMemo, useState, useTransition } from "react";
import { useBoolean } from "usehooks-ts";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/hooks/useCustomers";
import { customerUtils } from "@/lib/api/customers";
import type { CustomerWithCategories } from "@/types/customer";

type FilterState = {
	readonly searchQuery: string;
	readonly showArchived: boolean;
};

const CustomerRow = memo<{
	customer: CustomerWithCategories;
	onEdit: (customer: CustomerWithCategories) => void;
}>(
	({ customer, onEdit }) => {
		const initials = customerUtils.getCustomerInitials(customer.name);
		const avatarColor = customerUtils.getAvatarColor(customer.name);
		const formattedPhone = customerUtils.formatPhoneNumber(customer.phone);

		return (
			<TableRow className="hover:bg-muted/50">
				<TableCell className="font-medium">
					<div className="flex items-center gap-3">
						<div
							className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm text-white shadow-sm"
							style={{ backgroundColor: avatarColor }}
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
				</TableCell>
				<TableCell>
					<div className="flex flex-wrap gap-1">
						{customer.categories.length > 0 ? (
							customer.categories.map((category) => (
								<Badge key={category.id} variant="secondary">
									{category.name}
								</Badge>
							))
						) : (
							<span className="text-muted-foreground text-sm">
								No categories
							</span>
						)}
					</div>
				</TableCell>
				<TableCell className="max-w-xs">
					{customer.notes ? (
						<p className="truncate text-muted-foreground text-sm">
							{customer.notes}
						</p>
					) : (
						<span className="text-muted-foreground text-sm">No notes</span>
					)}
				</TableCell>
				<TableCell className="text-right">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(customer)}>
								Edit Customer
							</DropdownMenuItem>
							<DropdownMenuItem className="text-destructive">
								Archive Customer
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</TableCell>
			</TableRow>
		);
	},
	(prev, next) =>
		prev.customer.id === next.customer.id &&
		prev.customer.name === next.customer.name &&
		prev.customer.phone === next.customer.phone &&
		prev.customer.notes === next.customer.notes &&
		prev.customer.categories.length === next.customer.categories.length,
);

CustomerRow.displayName = "CustomerRow";

const EmptyState = memo<{
	searchQuery: string;
	showArchived: boolean;
	onAddCustomer: () => void;
}>(({ searchQuery, showArchived, onAddCustomer }) => (
	<div className="flex flex-col items-center justify-center py-12">
		<Users className="mb-4 h-12 w-12 text-muted-foreground" />
		{searchQuery ? (
			<>
				<h3 className="mb-2 font-medium text-foreground text-lg">
					No customers found
				</h3>
				<p className="mb-4 text-center text-muted-foreground">
					Try adjusting your search or add a new customer.
				</p>
			</>
		) : (
			<>
				<h3 className="mb-2 font-medium text-foreground text-lg">
					{showArchived ? "No archived customers" : "No customers yet"}
				</h3>
				<p className="mb-4 text-center text-muted-foreground">
					{showArchived
						? "No customers have been archived yet."
						: "Start building your customer directory by adding your first customer."}
				</p>
			</>
		)}
		{!showArchived && (
			<Button onClick={onAddCustomer}>
				<Plus className="mr-2 h-4 w-4" />
				Add Your First Customer
			</Button>
		)}
	</div>
));

EmptyState.displayName = "EmptyState";

export function CustomersPage() {
	const [filterState, setFilterState] = useState<FilterState>({
		searchQuery: "",
		showArchived: false,
	});
	const [selectedCustomer, setSelectedCustomer] =
		useState<CustomerWithCategories | null>(null);
	const startTransition = useTransition()[1];

	const {
		value: showForm,
		setTrue: openForm,
		setFalse: closeForm,
	} = useBoolean();

	const {
		data: customers,
		isLoading,
		error,
	} = useCustomers({
		show_archived: filterState.showArchived,
		sort_order: "asc",
	});

	const filteredCustomers = useMemo(() => {
		if (!customers) return [];
		if (!filterState.searchQuery.trim()) return customers;

		const query = filterState.searchQuery.toLowerCase();
		return customers.filter((customer) => {
			const nameMatch = customer.name.toLowerCase().includes(query);
			const phoneMatch = customer.phone.includes(query);
			const categoryMatch = customer.categories.some((cat) =>
				cat.name.toLowerCase().includes(query),
			);
			return nameMatch || phoneMatch || categoryMatch;
		});
	}, [customers, filterState.searchQuery]);

	const handleSearchChange = useCallback(
		(value: string) =>
			startTransition(() =>
				setFilterState((prev) => ({ ...prev, searchQuery: value })),
			),
		[startTransition],
	);

	const toggleArchived = useCallback(
		() =>
			setFilterState((prev) => ({ ...prev, showArchived: !prev.showArchived })),
		[],
	);

	const handleAddCustomer = useCallback(() => {
		setSelectedCustomer(null);
		openForm();
	}, [openForm]);

	const handleEditCustomer = useCallback(
		(customer: CustomerWithCategories) => {
			setSelectedCustomer(customer);
			openForm();
		},
		[openForm],
	);

	const handleCloseForm = useCallback(() => {
		setSelectedCustomer(null);
		closeForm();
	}, [closeForm]);

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex h-64 items-center justify-center">
					<div className="text-center">
						<Users className="mx-auto mb-2 h-8 w-8 animate-pulse text-muted-foreground" />
						<p className="text-muted-foreground">Loading customers...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex h-64 items-center justify-center">
					<div className="text-center">
						<p className="mb-2 text-destructive">Failed to load customers</p>
						<p className="text-muted-foreground text-sm">
							{error instanceof Error ? error.message : "Something went wrong"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	const customerCount = customers?.length ?? 0;
	const hasCustomers = filteredCustomers.length > 0;

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-6">
				{/* Header Section */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="font-bold text-2xl text-foreground">Customers</h1>
						<p className="text-muted-foreground">
							Manage your faraal customers and their information{" "}
							<span className="text-muted-foreground text-sm">
								({customerCount}{" "}
								{customerCount === 1 ? "customer" : "customers"})
							</span>
						</p>
					</div>

					<Button onClick={handleAddCustomer} className="w-full sm:w-auto">
						<Plus className="mr-2 h-4 w-4" />
						Add Customer
					</Button>
				</div>

				{/* Search and Filter Section */}
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search customers by name, phone, or category..."
							value={filterState.searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pl-10"
						/>
					</div>

					<Button
						variant={filterState.showArchived ? "default" : "outline"}
						onClick={toggleArchived}
						className="w-full sm:w-auto"
					>
						<Filter className="mr-2 h-4 w-4" />
						{filterState.showArchived ? "Show Active" : "Show Archived"}
					</Button>
				</div>

				{/* Customers Table */}
				{hasCustomers ? (
					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50 hover:bg-muted/50">
									<TableHead className="font-semibold text-foreground">
										Customer
									</TableHead>
									<TableHead className="font-semibold text-foreground">
										Categories
									</TableHead>
									<TableHead className="font-semibold text-foreground">
										Notes
									</TableHead>
									<TableHead className="text-right font-semibold text-foreground">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCustomers.map((customer) => (
									<CustomerRow
										key={customer.id}
										customer={customer}
										onEdit={handleEditCustomer}
									/>
								))}
							</TableBody>
						</Table>
					</div>
				) : (
					<div className="rounded-md border bg-card">
						<EmptyState
							searchQuery={filterState.searchQuery}
							showArchived={filterState.showArchived}
							onAddCustomer={handleAddCustomer}
						/>
					</div>
				)}

				<CustomerForm
					isOpen={showForm}
					onClose={handleCloseForm}
					editCustomer={selectedCustomer}
				/>
			</div>
		</div>
	);
}
