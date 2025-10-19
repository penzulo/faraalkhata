import {
	AlertCircle,
	Minus,
	Package,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UseOrderFormReturn } from "@/hooks/useOrderForm";
import { orderUtils } from "@/lib/api/orders";
import type { ProductWithCurrentPrice } from "@/types/product";

interface Step2ProductsProps {
	form: UseOrderFormReturn["form"];
	products: ProductWithCurrentPrice[];
	addProduct: (productId: string) => void;
	removeProduct: (productId: string) => void;
	updateProductQuantity: (productId: string, quantity: number) => void;
}

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

		const query = searchQuery.toLowerCase();
		return products.filter((product) =>
			product.name.toLowerCase().includes(query),
		);
	}, [products, searchQuery]);

	// Get selected products
	const selectedItems = form.state.values.items || [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h3 className="mb-1 font-semibold text-lg">Add Products</h3>
				<p className="text-gray-600 text-sm">
					Select products and specify quantities
				</p>
			</div>

			{/* Selected Products Summary */}
			{selectedItems.length > 0 && (
				<div className="space-y-3">
					<h4 className="font-medium text-sm">
						Selected Products ({selectedItems.length})
					</h4>
					{selectedItems.map((item) => {
						const product = products.find((p) => p.id === item.product_id);
						if (!product) return null;

						// Get stock info - handle both current_stock field or default to 0
						const stockAvailable = product.current_stock || 0;
						const stockNeeded = item.quantity - stockAvailable;
						const hasStockWarning = stockNeeded > 0;

						return (
							<Card key={item.product_id} className="p-4">
								<div className="space-y-3">
									{/* Product Info */}
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="font-medium">{product.name}</div>
											<div className="text-gray-600 text-sm">
												{orderUtils.formatCurrency(product.sell_price)} per{" "}
												{product.unit_of_measure}
											</div>
											<div className="mt-1 text-gray-500 text-xs">
												Stock: {stockAvailable} {product.unit_of_measure}
												{hasStockWarning && (
													<span className="ml-2 text-orange-600">
														(Need {stockNeeded.toFixed(2)} more)
													</span>
												)}
											</div>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => removeProduct(item.product_id)}
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</div>

									{/* Stock Warning */}
									{hasStockWarning && (
										<Alert className="border-orange-200 bg-orange-50">
											<AlertCircle className="h-4 w-4 text-orange-600" />
											<AlertDescription className="text-orange-800 text-sm">
												Insufficient stock. You'll need to purchase{" "}
												{stockNeeded.toFixed(2)} {product.unit_of_measure} more.
											</AlertDescription>
										</Alert>
									)}

									{/* Quantity Controls */}
									<QuantityControl
										product={product}
										quantity={item.quantity}
										onQuantityChange={(qty) =>
											updateProductQuantity(item.product_id, qty)
										}
									/>

									{/* Subtotal */}
									<div className="flex items-center justify-between border-t pt-2">
										<span className="text-gray-600 text-sm">Subtotal</span>
										<span className="font-semibold">
											{orderUtils.formatCurrency(
												product.sell_price * item.quantity,
											)}
										</span>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			)}

			{/* Product Selection */}
			<div className="space-y-3">
				<h4 className="font-medium text-sm">Add More Products</h4>

				{/* Search */}
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
					<Input
						placeholder="Search products..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Available Products */}
				<div className="max-h-96 space-y-2 overflow-y-auto">
					{filteredProducts.length > 0 ? (
						filteredProducts.map((product) => {
							const isSelected = selectedItems.some(
								(item) => item.product_id === product.id,
							);

							const stockAvailable = product.current_stock || 0;

							return (
								<button
									key={product.id}
									type="button"
									onClick={() => !isSelected && addProduct(product.id)}
									disabled={isSelected}
									className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
										isSelected
											? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-50"
											: "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
									}`}
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 font-medium">
												{product.name}
												{isSelected && (
													<Badge variant="secondary" className="text-xs">
														Added
													</Badge>
												)}
											</div>
											<div className="text-gray-600 text-sm">
												{orderUtils.formatCurrency(product.sell_price)} per{" "}
												{product.unit_of_measure}
											</div>
											<div className="mt-1 text-gray-500 text-xs">
												Stock: {stockAvailable} {product.unit_of_measure}
											</div>
										</div>
										{!isSelected && (
											<Plus className="h-5 w-5 text-orange-600" />
										)}
									</div>
								</button>
							);
						})
					) : (
						<div className="py-8 text-center text-gray-500">
							<Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
							<p className="text-sm">No products found</p>
						</div>
					)}
				</div>
			</div>

			{/* Validation Error */}
			{selectedItems.length === 0 && (
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
function QuantityControl({
	product,
	quantity,
	onQuantityChange,
}: {
	product: ProductWithCurrentPrice;
	quantity: number;
	onQuantityChange: (quantity: number) => void;
}) {
	const [customInput, setCustomInput] = useState(quantity.toString());

	const isKgBased = ["kg", "gram", "liter"].includes(
		product.unit_of_measure.toLowerCase(),
	);

	// Preset values for KG-based products
	const presetValues = isKgBased
		? [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0]
		: [1, 2, 3, 4, 5, 6, 8, 10];

	const increment = isKgBased ? 0.25 : 1;

	const handlePresetClick = (value: number) => {
		onQuantityChange(value);
		setCustomInput(value.toString());
	};

	const handleIncrement = () => {
		const newQty = quantity + increment;
		onQuantityChange(newQty);
		setCustomInput(newQty.toString());
	};

	const handleDecrement = () => {
		const newQty = Math.max(increment, quantity - increment);
		onQuantityChange(newQty);
		setCustomInput(newQty.toString());
	};

	const handleCustomChange = (value: string) => {
		setCustomInput(value);
		const parsed = Number.parseFloat(value);
		if (!Number.isNaN(parsed) && parsed > 0) {
			onQuantityChange(parsed);
		}
	};

	return (
		<div className="space-y-3">
			{/* Preset Buttons */}
			<div>
				<div className="mb-2 text-gray-600 text-xs">Quick Select:</div>
				<div className="grid grid-cols-4 gap-2">
					{presetValues.map((value) => (
						<button
							key={value}
							type="button"
							onClick={() => handlePresetClick(value)}
							className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
								quantity === value
									? "border-orange-500 bg-orange-50 font-medium text-orange-700"
									: "border-gray-200 hover:border-gray-300"
							}`}
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
					/>
					<span className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 transform text-gray-500 text-xs">
						{product.unit_of_measure}
					</span>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleIncrement}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
