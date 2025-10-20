import {
	AlertCircle,
	Minus,
	Package,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UseOrderFormReturn } from "@/hooks/useOrderForm";
import { orderUtils } from "@/lib/api/orders";
import type { ProductWithCurrentPrice } from "@/types/product";

interface Step2ProductsProps {
	form: UseOrderFormReturn["form"];
	products: readonly ProductWithCurrentPrice[];
	addProduct: (productId: string) => void;
	removeProduct: (productId: string) => void;
	updateProductQuantity: (productId: string, quantity: number) => void;
}

interface StockInfo {
	available: number;
	needed: number;
	hasWarning: boolean;
}

const calculateStockInfo = (
	available: number | null | undefined,
	quantity: number,
): StockInfo => {
	const stock = available ?? 0;
	const needed = Math.max(0, quantity - stock);
	return { available: stock, needed, hasWarning: needed > 0 };
};

const SelectedProductCard = memo<{
	product: ProductWithCurrentPrice;
	quantity: number;
	onRemove: () => void;
	onQuantityChange: (quantity: number) => void;
}>(({ product, quantity, onRemove, onQuantityChange }) => {
	const stockInfo = useMemo(
		() => calculateStockInfo(product.current_stock, quantity),
		[product.current_stock, quantity],
	);

	const subtotal = useMemo(
		() => product.sell_price * quantity,
		[product.sell_price, quantity],
	);

	return (
		<Card className="p-4">
			<div className="space-y-3">
				{/* Product Info */}
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<div className="font-medium text-foreground">{product.name}</div>
						<div className="text-muted-foreground text-sm">
							{orderUtils.formatCurrency(product.sell_price)} per{" "}
							{product.unit_of_measure}
						</div>
						<div className="mt-1 text-muted-foreground text-xs">
							Stock: {stockInfo.available} {product.unit_of_measure}
							{stockInfo.hasWarning && (
								<span className="ml-2 text-orange-600 dark:text-orange-400">
									(Need {stockInfo.needed.toFixed(2)} more)
								</span>
							)}
						</div>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onRemove}
						aria-label={`Remove ${product.name}`}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>

				{/* Stock Warning */}
				{stockInfo.hasWarning && (
					<Alert className="border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30">
						<AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
						<AlertDescription className="text-orange-800 text-sm dark:text-orange-300">
							Insufficient stock. You'll need to purchase{" "}
							{stockInfo.needed.toFixed(2)} {product.unit_of_measure} more.
						</AlertDescription>
					</Alert>
				)}

				{/* Quantity Controls */}
				<QuantityControl
					product={product}
					quantity={quantity}
					onQuantityChange={onQuantityChange}
				/>

				{/* Subtotal */}
				<div className="flex items-center justify-between border-t pt-2">
					<span className="text-muted-foreground text-sm">Subtotal</span>
					<span className="font-semibold text-foreground">
						{orderUtils.formatCurrency(subtotal)}
					</span>
				</div>
			</div>
		</Card>
	);
});

SelectedProductCard.displayName = "SelectedProductCard";

const AvailableProductButton = memo<{
	product: ProductWithCurrentPrice;
	isSelected: boolean;
	onAdd: () => void;
}>(({ product, isSelected, onAdd }) => {
	const stockAvailable = product.current_stock ?? 0;

	return (
		<button
			type="button"
			onClick={onAdd}
			disabled={isSelected}
			className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
				isSelected
					? "cursor-not-allowed border-border bg-muted/50 opacity-50"
					: "border-border hover:border-primary/50 hover:bg-muted/50"
			}`}
			aria-label={`Add ${product.name} to order`}
			aria-pressed={isSelected}
		>
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-2 font-medium text-foreground">
						{product.name}
						{isSelected && (
							<Badge variant="secondary" className="text-xs">
								Added
							</Badge>
						)}
					</div>
					<div className="text-muted-foreground text-sm">
						{orderUtils.formatCurrency(product.sell_price)} per{" "}
						{product.unit_of_measure}
					</div>
					<div className="mt-1 text-muted-foreground text-xs">
						Stock: {stockAvailable} {product.unit_of_measure}
					</div>
				</div>
				{!isSelected && <Plus className="h-5 w-5 text-primary" />}
			</div>
		</button>
	);
});

AvailableProductButton.displayName = "AvailableProductButton";

const EmptyProductState = memo(() => (
	<div className="py-8 text-center">
		<Package className="mx-auto mb-2 h-12 w-12 text-muted-foreground/40" />
		<p className="text-muted-foreground text-sm">No products found</p>
	</div>
));

EmptyProductState.displayName = "EmptyProductState";

export function Step2Products({
	form,
	products,
	addProduct,
	removeProduct,
	updateProductQuantity,
}: Step2ProductsProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// Filter products based on search
	const filteredProducts = useMemo(() => {
		if (!searchQuery.trim()) return products;

		const query = searchQuery.toLowerCase().trim();
		return products.filter((product) =>
			product.name.toLowerCase().includes(query),
		);
	}, [products, searchQuery]);

	const selectedItems = useMemo(
		() => form.state.values.items ?? [],
		[form.state.values.items],
	);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
		[],
	);

	return (
		<div className="flex h-full flex-col space-y-6">
			{/* Header */}
			<header>
				<h3 className="mb-1 font-semibold text-foreground text-lg">
					Add Products
				</h3>
				<p className="text-muted-foreground text-sm">
					Select products and specify quantities
				</p>
			</header>

			{/* Product Search - Fixed at top */}
			<div className="space-y-3">
				<h4 className="font-medium text-foreground text-sm">Search Products</h4>

				{/* Search Bar */}
				<div className="relative">
					<Search
						className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						placeholder="Search products..."
						value={searchQuery}
						onChange={handleSearchChange}
						className="pl-10"
						aria-label="Search products"
						autoFocus
					/>
				</div>
			</div>

			{/* Available Products - Scrollable */}
			<div className="flex-1 space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="font-medium text-foreground text-sm">
						Available Products
					</h4>
					{filteredProducts.length !== products.length && (
						<span className="text-muted-foreground text-xs">
							{filteredProducts.length} of {products.length} products
						</span>
					)}
				</div>

				<ScrollArea className="h-[250px]">
					<div className="space-y-2 pr-4">
						{filteredProducts.length > 0 ? (
							filteredProducts.map((product) => {
								const isSelected = selectedItems.some(
									(item) => item.product_id === product.id,
								);

								return (
									<AvailableProductButton
										key={product.id}
										product={product}
										isSelected={isSelected}
										onAdd={() => !isSelected && addProduct(product.id)}
									/>
								);
							})
						) : (
							<EmptyProductState />
						)}
					</div>
				</ScrollArea>
			</div>

			{/* Selected Products Summary */}
			{selectedItems.length > 0 ? (
				<div className="space-y-3">
					<h4 className="font-medium text-foreground text-sm">
						Selected Products ({selectedItems.length})
					</h4>
					<ScrollArea className="max-h-[350px]">
						<div className="space-y-3 pr-4">
							{selectedItems.map((item) => {
								const product = products.find((p) => p.id === item.product_id);
								if (!product) return null;

								return (
									<SelectedProductCard
										key={item.product_id}
										product={product}
										quantity={item.quantity}
										onRemove={() => removeProduct(item.product_id)}
										onQuantityChange={(qty) =>
											updateProductQuantity(item.product_id, qty)
										}
									/>
								);
							})}
						</div>
					</ScrollArea>
				</div>
			) : (
				/* Validation Message when no products selected */
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						Please add at least one product to continue
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

/**
 * Quantity Control Component with preset buttons and custom input
 */
const QuantityControl = memo<{
	product: ProductWithCurrentPrice;
	quantity: number;
	onQuantityChange: (quantity: number) => void;
}>(({ product, quantity, onQuantityChange }) => {
	const [customInput, setCustomInput] = useState(quantity.toString());

	const isKgBased = useMemo(
		() =>
			["kg", "gram", "liter"].includes(product.unit_of_measure.toLowerCase()),
		[product.unit_of_measure],
	);

	const presetValues = useMemo(
		() =>
			isKgBased
				? ([0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0] as const)
				: ([1, 2, 3, 4, 5, 6, 8, 10] as const),
		[isKgBased],
	);

	const increment = isKgBased ? 0.25 : 1;

	const handlePresetClick = useCallback(
		(value: number) => {
			onQuantityChange(value);
			setCustomInput(value.toString());
		},
		[onQuantityChange],
	);

	const handleIncrement = useCallback(() => {
		const newQty = quantity + increment;
		onQuantityChange(newQty);
		setCustomInput(newQty.toString());
	}, [quantity, increment, onQuantityChange]);

	const handleDecrement = useCallback(() => {
		const newQty = Math.max(increment, quantity - increment);
		onQuantityChange(newQty);
		setCustomInput(newQty.toString());
	}, [quantity, increment, onQuantityChange]);

	const handleCustomChange = useCallback(
		(value: string) => {
			setCustomInput(value);
			const parsed = Number.parseFloat(value);
			if (!Number.isNaN(parsed) && parsed > 0) onQuantityChange(parsed);
		},
		[onQuantityChange],
	);

	return (
		<div className="space-y-3">
			{/* Preset Buttons */}
			<div>
				<div className="mb-2 text-muted-foreground text-xs">Quick Select:</div>
				<div className="grid grid-cols-4 gap-2">
					{presetValues.map((value) => (
						<button
							key={value}
							type="button"
							onClick={() => handlePresetClick(value)}
							className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
								quantity === value
									? "border-primary bg-primary/10 font-medium text-primary"
									: "border-border hover:border-border/80"
							}`}
							aria-label={`Set quantity to ${value}`}
							aria-pressed={quantity === value}
						>
							{value}
						</button>
					))}
				</div>
			</div>

			{/* +/- Controls and Custom Input */}
			<div className="flex items-center gap-3">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleDecrement}
					disabled={quantity <= increment}
					aria-label="Decrease quantity"
				>
					<Minus className="h-4 w-4" />
				</Button>

				<div className="relative flex-1">
					<Input
						type="number"
						step={isKgBased ? "0.25" : "1"}
						min={isKgBased ? "0.25" : "1"}
						value={customInput}
						onChange={(e) => handleCustomChange(e.target.value)}
						className="text-center font-medium"
						aria-label="Product quantity"
					/>
					<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 text-muted-foreground text-xs">
						{product.unit_of_measure}
					</span>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleIncrement}
					aria-label="Increase quantity"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
});

QuantityControl.displayName = "QuantityControl";
