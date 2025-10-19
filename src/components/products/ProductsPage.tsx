import {
	AlertCircle,
	MoreHorizontal,
	Package,
	Plus,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { useBoolean } from "usehooks-ts";
import { ProductForm } from "@/components/products/ProductForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import type { ProductWithCurrentPrice } from "@/types/product";

type ProfitStatus = "excellent" | "good" | "fair" | "poor" | "loss";

interface ProductMetrics {
	profit: number;
	margin: number;
	status: ProfitStatus;
	color: string;
	badgeVariant: "default" | "secondary" | "destructive";
}

const calculateProductMetrics = (
	sellPrice: number,
	costPrice: number,
): ProductMetrics => {
	const profit = sellPrice - costPrice;
	const margin = (profit / sellPrice) * 100;

	let status: ProfitStatus;
	let color: string;
	let badgeVariant: "default" | "secondary" | "destructive";

	if (margin >= 40) {
		status = "excellent";
		color = "text-emerald-600 dark:text-emerald-400";
		badgeVariant = "default";
	} else if (margin >= 30) {
		status = "good";
		color = "text-green-600 dark:text-green-400";
		badgeVariant = "default";
	} else if (margin >= 15) {
		status = "fair";
		color = "text-yellow-600 dark:text-yellow-400";
		badgeVariant = "secondary";
	} else if (margin > 0) {
		status = "poor";
		color = "text-orange-600 dark:text-orange-400";
		badgeVariant = "secondary";
	} else {
		status = "loss";
		color = "text-red-600 dark:text-red-400";
		badgeVariant = "destructive";
	}

	return { profit, margin, status, color, badgeVariant };
};

const ProductRow = memo<{
	product: ProductWithCurrentPrice;
	onEdit: (product: ProductWithCurrentPrice) => void;
}>(
	({ product, onEdit }) => {
		const metrics = useMemo(
			() =>
				calculateProductMetrics(product.sell_price, product.current_cost_price),
			[product.sell_price, product.current_cost_price],
		);

		const getProfitIcon = () => {
			if (metrics.status === "excellent" || metrics.status === "good")
				return <TrendingUp className="h-3 w-3" />;
			if (metrics.status === "poor" || metrics.status === "loss")
				return <TrendingDown className="h-3 w-3" />;
			return null;
		};

		return (
			<TableRow className="hover:bg-muted/50">
				<TableCell className="font-medium">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<Package className="h-5 w-5 text-primary" />
						</div>
						<div>
							<div className="font-medium text-foreground">{product.name}</div>
							<div className="text-muted-foreground text-xs">
								{product.unit_of_measure}
							</div>
						</div>
					</div>
				</TableCell>
				<TableCell>
					<div className="text-foreground">
						₹{product.sell_price.toFixed(2)}
					</div>
				</TableCell>
				<TableCell>
					<div className="text-muted-foreground">
						₹{product.current_cost_price.toFixed(2)}
					</div>
				</TableCell>
				<TableCell>
					<div className="flex flex-col gap-1">
						<span className={`font-medium ${metrics.color}`}>
							₹{metrics.profit.toFixed(2)}
						</span>
						<Badge
							variant={metrics.badgeVariant}
							className="w-fit gap-1 text-xs"
						>
							{getProfitIcon()}
							{metrics.margin.toFixed(1)}%
						</Badge>
					</div>
				</TableCell>
				<TableCell className="text-right">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Product actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(product)}>
								Edit Product
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-destructive">
								Delete Product
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</TableCell>
			</TableRow>
		);
	},
	(prev, next) =>
		prev.product.id === next.product.id &&
		prev.product.name === next.product.name &&
		prev.product.sell_price === next.product.sell_price &&
		prev.product.current_cost_price === next.product.current_cost_price,
);

ProductRow.displayName = "ProductRow";

const TableSkeleton = memo(() => (
	<div className="rounded-md border">
		<Table>
			<TableHeader>
				<TableRow className="bg-muted/50 hover:bg-muted/50">
					<TableHead>Product</TableHead>
					<TableHead>Sell Price</TableHead>
					<TableHead>Cost Price</TableHead>
					<TableHead>Profit</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: 5 }, (_, k) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Only for Table skeleton
					<TableRow key={k}>
						<TableCell>
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-lg" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-16" />
								</div>
							</div>
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-16" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-16" />
						</TableCell>
						<TableCell>
							<div className="space-y-2">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-5 w-12" />
							</div>
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

const EmptyState = memo<{
	onAddProduct: () => void;
}>(({ onAddProduct }) => (
	<div className="flex flex-col items-center justify-center rounded-md border bg-card py-12">
		<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
			<Package className="h-8 w-8 text-primary" />
		</div>
		<h2 className="mb-2 font-semibold text-foreground text-xl">
			No products yet
		</h2>
		<p className="mb-6 max-w-sm text-center text-muted-foreground">
			Start building your product catalog by adding your first faraal item
		</p>
		<Button onClick={onAddProduct} className="gap-2">
			<Plus className="h-4 w-4" />
			Add Your First Product
		</Button>
	</div>
));

EmptyState.displayName = "EmptyState";

const ErrorState = memo<{
	error: Error | unknown;
}>(({ error }) => (
	<div className="flex flex-col items-center justify-center rounded-md border bg-card py-12">
		<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
			<AlertCircle className="h-8 w-8 text-destructive" />
		</div>
		<h2 className="mb-2 font-semibold text-foreground text-xl">
			Failed to load products
		</h2>
		<p className="mb-4 text-center text-muted-foreground">
			{error instanceof Error ? error.message : "Something went wrong"}
		</p>
		<Button onClick={() => window.location.reload()}>Try Again</Button>
	</div>
));

ErrorState.displayName = "ErrorState";

export function ProductsPage() {
	const { data: products, isLoading, error } = useProducts();

	const {
		value: showForm,
		setTrue: openForm,
		setFalse: closeForm,
	} = useBoolean();

	const [editProduct, setEditProduct] =
		useState<ProductWithCurrentPrice | null>(null);

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

	const productCount = products?.length ?? 0;
	const hasProducts = Boolean(products && productCount > 0);

	const catalogMetrics = useMemo(() => {
		if (!products || products.length === 0) return null;

		const totalValue = products.reduce((sum, p) => sum + p.sell_price, 0);
		const totalCost = products.reduce(
			(sum, p) => sum + p.current_cost_price,
			0,
		);
		const totalProfit = totalValue - totalCost;
		const avgMargin = (totalProfit / totalValue) * 100;

		return {
			totalValue,
			totalProfit,
			avgMargin,
		};
	}, [products]);

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="space-y-6">
					<div>
						<Skeleton className="mb-2 h-8 w-48" />
						<Skeleton className="h-4 w-64" />
					</div>
					<TableSkeleton />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="space-y-6">
					<div>
						<h1 className="mb-2 font-bold text-2xl text-foreground">
							Product Catalog
						</h1>
						<p className="text-muted-foreground">
							Manage your faraal products, pricing, and inventory
						</p>
					</div>
					<ErrorState error={error} />
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="space-y-6">
				{/* Header with metrics */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="mb-2 font-bold text-2xl text-foreground">
							Product Catalog
						</h1>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
							<span>Manage your faraal products, pricing, and inventory</span>
							{hasProducts && (
								<>
									<span className="font-medium text-foreground text-sm">
										{productCount} {productCount === 1 ? "product" : "products"}
									</span>
									{catalogMetrics && (
										<>
											<span className="hidden text-muted-foreground sm:inline">
												•
											</span>
											<span className="text-sm">
												Avg Margin:{" "}
												<span
													className={
														catalogMetrics.avgMargin >= 30
															? "font-medium text-green-600 dark:text-green-400"
															: catalogMetrics.avgMargin >= 15
																? "font-medium text-yellow-600 dark:text-yellow-400"
																: "font-medium text-red-600 dark:text-red-400"
													}
												>
													{catalogMetrics.avgMargin.toFixed(1)}%
												</span>
											</span>
										</>
									)}
								</>
							)}
						</div>
					</div>

					<Button onClick={handleAddNew} className="w-full sm:w-auto">
						<Plus className="mr-2 h-4 w-4" />
						Add Product
					</Button>
				</div>

				{/* Products Table or Empty State */}
				{hasProducts ? (
					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50 hover:bg-muted/50">
									<TableHead className="font-semibold text-foreground">
										Product
									</TableHead>
									<TableHead className="font-semibold text-foreground">
										Sell Price
									</TableHead>
									<TableHead className="font-semibold text-foreground">
										Cost Price
									</TableHead>
									<TableHead className="font-semibold text-foreground">
										Profit
									</TableHead>
									<TableHead className="text-right font-semibold text-foreground">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{
									// biome-ignore lint/suspicious/noTsIgnore: We have already handled Empty case.
									// @ts-ignore
									products.map((product) => (
										<ProductRow
											key={product.id}
											product={product}
											onEdit={handleEdit}
										/>
									))
								}
							</TableBody>
						</Table>
					</div>
				) : (
					<EmptyState onAddProduct={handleAddNew} />
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
