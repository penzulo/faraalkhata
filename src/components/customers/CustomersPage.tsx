import { Filter, Plus, Search, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useBoolean, useMediaQuery } from "usehooks-ts";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/hooks/useCustomers";
import type { CustomerWithCategories } from "@/types/customer";

export function CustomersPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCustomer, setSelectedCustomer] =
		useState<CustomerWithCategories | null>(null);
	const { value: archivedCustomers, toggle: toggleArchivedCustomers } =
		useBoolean();

	const {
		value: showForm,
		setTrue: openForm,
		setFalse: closeForm,
	} = useBoolean();

	// Device detection for responsive design
	const isMobile = useMediaQuery("(max-width: 767px)");
	const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

	// Fetch customers data
	const {
		data: customers,
		isLoading,
		error,
	} = useCustomers({
		show_archived: archivedCustomers,
		sort_order: "asc",
	});

	// Filter customers based on search
	const filteredCustomers = useMemo(() => {
		if (!customers) return [];
		if (!searchQuery.trim()) return customers;

		const query = searchQuery.toLowerCase();
		return customers.filter(
			(customer) =>
				customer.name.toLowerCase().includes(query) ||
				customer.phone.includes(query) ||
				customer.categories.some((cat) =>
					cat.name.toLowerCase().includes(query),
				),
		);
	}, [customers, searchQuery]);

	// Device-specific grid columns
	const gridCols = useMemo(() => {
		if (isMobile) return "grid-cols-1";
		if (isTablet) return "grid-cols-2";
		return "grid-cols-3";
	}, [isMobile, isTablet]);

	// Event handlers
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

	const handleViewCustomer = useCallback(
		(customer: CustomerWithCategories) => {
			handleEditCustomer(customer);
		},
		[handleEditCustomer],
	);

	const handleCloseForm = useCallback(() => {
		setSelectedCustomer(null);
		closeForm();
	}, [closeForm]);

	// Loading state
	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="text-center">
					<Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
					<p className="text-gray-500">Loading customers...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="text-center">
					<p className="mb-2 text-red-600">Failed to load customers</p>
					<p className="text-gray-500 text-sm">
						{error instanceof Error ? error.message : "Something went wrong"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header Section - Device Responsive */}
			<div
				className={`flex ${isMobile ? "flex-col" : "flex-row"} ${isMobile ? "gap-4" : "items-center justify-between"}`}
			>
				<div className={isMobile ? "text-center" : ""}>
					<h1 className="font-bold text-2xl text-gray-900">Customers</h1>
					<p className="text-gray-600">
						Manage your faraal customers and their information{" "}
						{customers && (
							<span className="text-gray-500 text-sm">
								({customers.length}{" "}
								{customers.length === 1 ? "customer" : "customers"})
							</span>
						)}
					</p>
				</div>

				<Button
					onClick={handleAddCustomer}
					className={isMobile ? "w-full" : "w-auto"}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add Customer
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
								? "Search customers..."
								: "Search customers by name, phone, or category..."
						}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Archive Toggle */}
				<Button
					variant={archivedCustomers ? "default" : "outline"}
					onClick={toggleArchivedCustomers}
					className={isMobile ? "w-full" : "w-auto"}
				>
					<Filter className="mr-2 h-4 w-4" />
					{archivedCustomers ? "Show Active" : "Show Archived"}
				</Button>
			</div>

			{/* Customers Grid - Device Responsive */}
			{filteredCustomers.length > 0 ? (
				<div className={`grid gap-4 ${gridCols}`}>
					{filteredCustomers.map((customer) => (
						<CustomerCard
							key={customer.id}
							customer={customer}
							onEdit={handleEditCustomer}
							onView={handleViewCustomer}
						/>
					))}
				</div>
			) : (
				<div className="py-12 text-center">
					<Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
					{searchQuery ? (
						<>
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								No customers found
							</h3>
							<p className="mb-4 text-gray-500">
								Try adjusting your search or add a new customer.
							</p>
						</>
					) : (
						<>
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								{archivedCustomers
									? "No archived customers"
									: "No customers yet"}
							</h3>
							<p className="mb-4 text-gray-500">
								{archivedCustomers
									? "No customers have been archived yet."
									: "Start building your customer directory by adding your first customer."}
							</p>
						</>
					)}
					{!archivedCustomers && (
						<Button onClick={handleAddCustomer}>
							<Plus className="mr-2 h-4 w-4" />
							Add Your First Customer
						</Button>
					)}
				</div>
			)}

			{/* Customer Form - Device Responsive */}
			<CustomerForm
				isOpen={showForm}
				onClose={handleCloseForm}
				editCustomer={selectedCustomer}
			/>
		</div>
	);
}
