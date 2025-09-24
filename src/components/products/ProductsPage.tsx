import { AlertCircle, Package, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useBoolean } from "usehooks-ts";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductForm } from "@/components/products/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import type { ProductWithCurrentPrice } from "@/types/product";

export function ProductsPage() {
	const { data: products, isLoading, error } = useProducts();

	// Clean state management with useBoolean
	const {
		value: showForm,
		setTrue: openForm,
		setFalse: closeForm,
	} = useBoolean();

	const [editProduct, setEditProduct] =
		useState<ProductWithCurrentPrice | null>(null);

	// Optimized event handlers
	const handleEdit = useCallback(
		(product: ProductWithCurrentPrice) => {
			setEditProduct(product);
			openForm();
		},
		[openForm],
	);

	const handleCloseForm = useCallback(() => {
		closeForm();
		setEditProduct(null);
	}, [closeForm]);

	const handleAddNew = useCallback(() => {
		setEditProduct(null);
		openForm();
	}, [openForm]);

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background pb-20 md:pb-8">
				<div className="container mx-auto max-w-4xl px-4 py-6">
					{/* Header Skeleton */}
					<div className="mb-6">
						<Skeleton className="mb-2 h-8 w-48" />
						<Skeleton className="h-4 w-64" />
					</div>

					{/* Product Cards Skeleton */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }, (_, k) => (
							<Card key={k}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex flex-1 items-start gap-3">
											<Skeleton className="h-10 w-10 rounded-lg" />
											<div className="flex-1 space-y-2">
												<Skeleton className="h-4 w-32" />
												<Skeleton className="h-3 w-24" />
												<Skeleton className="h-3 w-20" />
											</div>
										</div>
										<Skeleton className="h-8 w-8 rounded" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="min-h-screen bg-background pb-20 md:pb-8">
				<div className="container mx-auto max-w-4xl px-4 py-6">
					<div className="flex min-h-[400px] flex-col items-center justify-center text-center">
						<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
							<AlertCircle className="h-8 w-8 text-destructive" />
						</div>
						<h2 className="mb-2 font-semibold text-foreground text-xl">
							Failed to load products
						</h2>
						<p className="mb-4 text-muted-foreground">
							{error instanceof Error ? error.message : "Something went wrong"}
						</p>
						<Button onClick={() => window.location.reload()}>Try Again</Button>
					</div>
				</div>
			</div>
		);
	}

	const isEmpty = !products || products.length === 0;

	return (
		<div className="min-h-screen bg-background pb-20 md:pb-8">
			<div className="container mx-auto max-w-4xl px-4 py-6">
				{/* Header */}
				<div className="mb-6">
					<h1 className="mb-2 font-bold text-2xl text-foreground">
						Product Catalog
					</h1>
					<p className="text-muted-foreground">
						Manage your faraal products, pricing, and inventory
						{products && (
							<span className="ml-2 font-medium text-sm">
								({products.length}{" "}
								{products.length === 1 ? "product" : "products"})
							</span>
						)}
					</p>
				</div>

				{/* Empty State */}
				{isEmpty && (
					<div className="flex min-h-[400px] flex-col items-center justify-center text-center">
						<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<Package className="h-8 w-8 text-primary" />
						</div>
						<h2 className="mb-2 font-semibold text-foreground text-xl">
							No products yet
						</h2>
						<p className="mb-6 max-w-sm text-muted-foreground">
							Start building your product catalog by adding your first faraal
							item
						</p>
						<Button onClick={handleAddNew} className="gap-2">
							<Plus className="h-4 w-4" />
							Add Your First Product
						</Button>
					</div>
				)}

				{/* Product Grid */}
				{!isEmpty && (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{products.map((product) => (
							<ProductCard
								key={product.id}
								product={product}
								onEdit={handleEdit}
							/>
						))}
					</div>
				)}

				{/* Floating Action Button */}
				{!isEmpty && (
					<Button
						onClick={handleAddNew}
						className="fixed right-6 bottom-20 z-40 h-14 w-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 md:right-8 md:bottom-8"
						size="icon"
					>
						<Plus className="h-6 w-6" />
					</Button>
				)}

				{/* Product Form */}
				<ProductForm
					isOpen={showForm}
					onClose={handleCloseForm}
					editProduct={editProduct}
				/>
			</div>
		</div>
	);
}
