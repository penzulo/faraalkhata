import { useForm } from "@tanstack/react-form";
import { Package } from "lucide-react";
import { useId } from "react";
import { useMediaQuery } from "usehooks-ts";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { ProductFormData, ProductWithCurrentPrice } from "@/types/product";

const productSchema = z.object({
	name: z.string().min(2, "Product name must be at least 2 characters"),
	unit_of_measure: z.string().min(1, "Please select a unit of measure"),
	sell_price: z.number().min(0.01, "Sell price must be greater than 0"),
	cost_price: z.number().min(0.01, "Cost price must be greater than 0"),
});

const UNIT_OPTIONS = [
	{ value: "kg", label: "Kilogram (kg)" },
	{ value: "piece", label: "Piece" },
	{ value: "dozen", label: "Dozen" },
	{ value: "gram", label: "Gram (g)" },
	{ value: "liter", label: "Liter (L)" },
	{ value: "packet", label: "Packet" },
	{ value: "box", label: "Box" },
];

interface ProductFormProps {
	isOpen: boolean;
	onClose: () => void;
	editProduct?: ProductWithCurrentPrice | null;
}

export function ProductForm({
	isOpen,
	onClose,
	editProduct,
}: ProductFormProps) {
	const nameId = useId();
	const unitId = useId();
	const sellPriceId = useId();
	const costPriceId = useId();

	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();

	// Use usehooks-ts for media query - this should work better
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const isEditing = Boolean(editProduct);
	const isLoading = createProduct.isPending || updateProduct.isPending;

	const form = useForm({
		defaultValues: {
			name: editProduct?.name || "",
			unit_of_measure: editProduct?.unit_of_measure || "",
			sell_price: editProduct?.sell_price || 0,
			cost_price: editProduct?.current_cost_price || 0,
		} as ProductFormData,
		onSubmit: async ({ value }) => {
			try {
				const validatedData = productSchema.parse(value);

				if (isEditing && editProduct) {
					await updateProduct.mutateAsync({
						id: editProduct.id,
						data: validatedData,
					});
				} else {
					await createProduct.mutateAsync(validatedData);
				}
				handleClose();
			} catch (error) {
				if (error instanceof z.ZodError) {
					console.error("Validation error:", error.errors);
				} else {
					console.error("Form submission error:", error);
				}
			}
		},
	});

	const handleClose = () => {
		form.reset();
		onClose();
	};

	// Calculate profit margin for preview
	const sellPrice = form.state.values.sell_price || 0;
	const costPrice = form.state.values.cost_price || 0;
	const profitMargin =
		sellPrice && costPrice ? ((sellPrice - costPrice) / sellPrice) * 100 : 0;
	const profit = sellPrice - costPrice;

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<SheetContent
				side={isDesktop ? "right" : "bottom"}
				className={`flex flex-col p-0 ${
					isDesktop
						? "h-full w-[480px] sm:max-w-[480px]"
						: "h-[90vh] max-h-[90vh] w-full"
				}
        `}
			>
				{/* Header */}
				<SheetHeader className="shrink-0 border-border border-b px-6 py-6">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
								<Package className="h-5 w-5 text-primary" />
							</div>
							<div>
								<SheetTitle className="text-left font-semibold text-xl">
									{isEditing ? "Edit Product" : "Add New Product"}
								</SheetTitle>
								<SheetDescription className="mt-1 text-left">
									{isEditing
										? "Update the product details below."
										: "Fill in the details to add a new product to your catalog."}
								</SheetDescription>
							</div>
						</div>
					</div>
				</SheetHeader>

				{/* Scrollable Content */}
				<ScrollArea className="min-h-0 flex-1">
					<div className={`px-6 py-6 ${!isDesktop ? "pb-6" : ""}`}>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-6"
						>
							{/* Product Name */}
							<form.Field
								name="name"
								validators={{
									onChange: ({ value }) => {
										const result = z
											.string()
											.min(2, "Product name must be at least 2 characters")
											.safeParse(value);
										return result.success
											? undefined
											: result.error.errors[0]?.message;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={nameId} className="font-medium text-sm">
											Product Name
										</Label>
										<Input
											id={nameId}
											name="name"
											placeholder="e.g., Chakali, Bundi Ladoo"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											disabled={isLoading}
											className="h-11"
										/>
										{field.state.meta.errors && (
											<p className="text-destructive text-sm">
												{field.state.meta.errors}
											</p>
										)}
									</div>
								)}
							</form.Field>

							{/* Unit of Measure */}
							<form.Field
								name="unit_of_measure"
								validators={{
									onChange: ({ value }) => {
										const result = z
											.string()
											.min(1, "Please select a unit of measure")
											.safeParse(value);
										return result.success
											? undefined
											: result.error.errors[0]?.message;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={unitId} className="font-medium text-sm">
											Unit of Measure
										</Label>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
											disabled={isLoading}
										>
											<SelectTrigger id={unitId} className="h-11">
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>
											<SelectContent>
												{UNIT_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{field.state.meta.errors && (
											<p className="text-destructive text-sm">
												{field.state.meta.errors}
											</p>
										)}
									</div>
								)}
							</form.Field>

							{/* Price Fields */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{/* Sell Price */}
								<form.Field
									name="sell_price"
									validators={{
										onChange: ({ value }) => {
											const result = z
												.number()
												.min(0.01, "Must be greater than 0")
												.safeParse(value);
											return result.success
												? undefined
												: result.error.errors[0]?.message;
										},
									}}
								>
									{(field) => (
										<div className="space-y-2">
											<Label
												htmlFor={sellPriceId}
												className="font-medium text-sm"
											>
												Sell Price (₹)
											</Label>
											<Input
												id={sellPriceId}
												name="sell_price"
												type="number"
												step="0.01"
												min="0"
												placeholder="0.00"
												value={field.state.value || ""}
												onChange={(e) =>
													field.handleChange(Number(e.target.value))
												}
												onBlur={field.handleBlur}
												disabled={isLoading}
												className="h-11"
											/>
											{field.state.meta.errors && (
												<p className="text-destructive text-sm">
													{field.state.meta.errors}
												</p>
											)}
										</div>
									)}
								</form.Field>

								{/* Cost Price */}
								<form.Field
									name="cost_price"
									validators={{
										onChange: ({ value }) => {
											const result = z
												.number()
												.min(0.01, "Must be greater than 0")
												.safeParse(value);
											return result.success
												? undefined
												: result.error.errors[0]?.message;
										},
									}}
								>
									{(field) => (
										<div className="space-y-2">
											<Label
												htmlFor={costPriceId}
												className="font-medium text-sm"
											>
												Cost Price (₹)
											</Label>
											<Input
												id={costPriceId}
												name="cost_price"
												type="number"
												step="0.01"
												min="0"
												placeholder="0.00"
												value={field.state.value || ""}
												onChange={(e) =>
													field.handleChange(Number(e.target.value))
												}
												onBlur={field.handleBlur}
												disabled={isLoading}
												className="h-11"
											/>
											{field.state.meta.errors && (
												<p className="text-destructive text-sm">
													{field.state.meta.errors}
												</p>
											)}
										</div>
									)}
								</form.Field>
							</div>

							{/* Profit Preview */}
							{sellPrice > 0 && costPrice > 0 && (
								<>
									<Separator />
									<div className="space-y-3 rounded-lg bg-muted/50 p-4">
										<h4 className="font-medium text-foreground text-sm">
											Profit Analysis
										</h4>
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<span className="text-muted-foreground">
													Profit per unit:
												</span>
												<p className="font-medium text-foreground">
													₹{profit.toFixed(2)}
												</p>
											</div>
											<div>
												<span className="text-muted-foreground">
													Profit margin:
												</span>
												<p
													className={`font-medium ${
														profitMargin >= 30
															? "text-green-600"
															: profitMargin >= 20
																? "text-yellow-600"
																: "text-red-600"
													}`}
												>
													{profitMargin.toFixed(1)}%
												</p>
											</div>
										</div>
									</div>
								</>
							)}
						</form>
					</div>
				</ScrollArea>

				{/* Sticky Footer Actions */}
				<div
					className={`shrink-0 border-border border-t bg-background ${isDesktop ? "px-6 py-4" : "px-6 py-4 pb-6"}`}
				>
					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isLoading}
							className="h-11 flex-1"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || !form.state.isValid}
							className="h-11 flex-1"
							onClick={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
						>
							{isLoading
								? isEditing
									? "Updating..."
									: "Creating..."
								: isEditing
									? "Update Product"
									: "Create Product"}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
