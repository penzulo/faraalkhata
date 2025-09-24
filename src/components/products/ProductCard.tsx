import { Edit, MoreHorizontal, Package, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteProduct } from "@/hooks/useProducts";
import type { ProductWithCurrentPrice } from "@/types/product";

interface ProductCardProps {
	product: ProductWithCurrentPrice;
	onEdit: (product: ProductWithCurrentPrice) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const deleteProduct = useDeleteProduct();

	const handleDelete = () => {
		deleteProduct.mutate(product.id);
		setShowDeleteDialog(false);
	};

	const formatCurrency = (amount: number) => {
		return `₹${amount.toFixed(2)}`;
	};

	// Calculate profit margin
	const profitMargin = product.current_cost_price
		? ((product.sell_price - product.current_cost_price) / product.sell_price) *
			100
		: 0;

	const profitColor =
		profitMargin >= 30
			? "text-green-600"
			: profitMargin >= 20
				? "text-yellow-600"
				: "text-red-600";

	return (
		<>
			<Card className="border border-border transition-shadow duration-200 hover:shadow-md">
				<CardContent className="p-4">
					<div className="flex items-start justify-between">
						<div className="flex min-w-0 flex-1 items-start gap-3">
							{/* Product Icon */}
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
								<Package className="h-5 w-5 text-primary" />
							</div>

							{/* Product Info */}
							<div className="min-w-0 flex-1">
								<h3 className="mb-1 truncate font-semibold text-base text-foreground">
									{product.name}
								</h3>

								{/* Pricing Info */}
								<div className="space-y-1">
									<div className="flex flex-wrap gap-2 text-sm">
										<span className="text-muted-foreground">
											Sell:{" "}
											<span className="font-medium text-foreground">
												{formatCurrency(product.sell_price)}
											</span>
										</span>
									</div>

									{/* Unit and Margin */}
									<div className="flex items-center gap-2 text-muted-foreground text-xs">
										<span>per {product.unit_of_measure}</span>
										{product.current_cost_price && (
											<>
												<span>•</span>
												<span className={profitColor}>
													{profitMargin.toFixed(1)}% margin
												</span>
											</>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Actions Menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 shrink-0 p-0"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-40">
								<DropdownMenuItem
									onClick={() => onEdit(product)}
									className="text-sm"
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setShowDeleteDialog(true)}
									className="text-destructive text-sm focus:bg-destructive/10 focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Product</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete <strong>{product.name}</strong>?
							This action cannot be undone and will remove all associated price
							history.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleteProduct.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteProduct.isPending ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
