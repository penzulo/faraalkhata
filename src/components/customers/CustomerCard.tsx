import {
	Archive,
	Edit,
	MoreHorizontal,
	Phone,
	User,
	Users,
} from "lucide-react";
import { useCallback, useMemo } from "react";
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
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArchiveCustomer } from "@/hooks/useCustomers";
import { customerUtils } from "@/lib/api/customers";
import type { CustomerWithCategories } from "@/types/customer";

interface CustomerCardProps {
	customer: CustomerWithCategories;
	onEdit: (customer: CustomerWithCategories) => void;
	onView: (customer: CustomerWithCategories) => void;
}

export function CustomerCard({ customer, onEdit, onView }: CustomerCardProps) {
	const {
		value: showArchiveDialog,
		setTrue: openArchiveDialog,
		setFalse: closeArchiveDialog,
	} = useBoolean();

	const archiveCustomer = useArchiveCustomer();

	// Customer display data (similar to your profitData pattern)
	const customerData = useMemo(() => {
		const initials = customerUtils.getCustomerInitials(customer.name);
		const avatarColor = customerUtils.getAvatarColor(customer.name);
		const formattedPhone = customerUtils.formatPhoneNumber(customer.phone);

		// Category analysis
		const primaryCategory = customer.categories[0]?.name || "No category";
		const totalCategories = customer.categories.length;
		const categoryText =
			totalCategories > 1
				? `${primaryCategory} +${totalCategories - 1}`
				: primaryCategory;

		// Archive status styling
		const archiveStyle = customer.is_archived ? "opacity-60" : "opacity-100";

		return {
			initials,
			avatarColor,
			formattedPhone,
			primaryCategory,
			totalCategories,
			categoryText,
			archiveStyle,
		};
	}, [customer]);

	// Event handlers following your pattern
	const handleEdit = useCallback(() => {
		onEdit(customer);
	}, [onEdit, customer]);

	const handleView = useCallback(() => {
		onView(customer);
	}, [onView, customer]);

	const handleArchive = useCallback(() => {
		archiveCustomer.mutateAsync({
			id: customer.id,
			is_archived: !customer.is_archived,
		});
		closeArchiveDialog();
	}, [archiveCustomer, customer.id, customer.is_archived, closeArchiveDialog]);

	return (
		<>
			<Card
				className={`transition-all hover:shadow-lg ${customerData.archiveStyle}`}
			>
				<CardContent className="p-4">
					<div className="flex items-start justify-between">
						{/* Customer Avatar & Info */}
						<div className="flex flex-1 items-start space-x-3">
							{/* Avatar Circle */}
							<div
								className="flex h-12 w-12 items-center justify-center rounded-full font-semibold text-sm text-white"
								style={{ backgroundColor: customerData.avatarColor }}
							>
								{customerData.initials}
							</div>

							{/* Customer Details */}
							<div className="min-w-0 flex-1">
								{/* Name & Archive Badge */}
								<div className="mb-1 flex items-center gap-2">
									<h3 className="truncate font-semibold text-gray-900">
										{customer.name}
									</h3>
									{customer.is_archived && (
										<Badge variant="secondary" className="text-xs">
											Archived
										</Badge>
									)}
								</div>

								{/* Phone Number */}
								<div className="mb-2 flex items-center gap-1 text-gray-600 text-sm">
									<Phone className="h-3 w-3" />
									<span>{customerData.formattedPhone}</span>
								</div>

								{/* Categories */}
								<div className="flex items-center gap-1 text-gray-500 text-sm">
									<Users className="h-3 w-3" />
									<span className="truncate">{customerData.categoryText}</span>
								</div>

								{/* Notes Preview */}
								{customer.notes && (
									<p className="mt-2 truncate text-gray-400 text-xs">
										{customer.notes}
									</p>
								)}
							</div>
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
									<User className="mr-2 h-4 w-4" />
									View Details
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleEdit}>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem onClick={openArchiveDialog}>
									<Archive className="mr-2 h-4 w-4" />
									{customer.is_archived ? "Unarchive" : "Archive"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Category Badges */}
					{customer.categories.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1">
							{customer.categories.slice(0, 3).map((category) => (
								<Badge key={category.id} variant="outline" className="text-xs">
									{category.name}
								</Badge>
							))}
							{customer.categories.length > 3 && (
								<Badge variant="outline" className="text-xs">
									+{customer.categories.length - 3} more
								</Badge>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Archive Confirmation Dialog */}
			<AlertDialog open={showArchiveDialog} onOpenChange={closeArchiveDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{customer.is_archived ? "Unarchive" : "Archive"} Customer
						</AlertDialogTitle>
						<AlertDialogDescription>
							{customer.is_archived
								? `Are you sure you want to restore ${customer.name}? They will appear in your active customer list.`
								: `Are you sure you want to archive ${customer.name}? They will be hidden from your active customer list but their order history will be preserved.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleArchive}
							disabled={archiveCustomer.isPending}
						>
							{archiveCustomer.isPending
								? "Processing..."
								: customer.is_archived
									? "Unarchive"
									: "Archive"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
