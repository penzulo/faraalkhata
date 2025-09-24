import { Minus, Package, TrendingDown, TrendingUp } from "lucide-react";
import React, { useId } from "react";
import { Badge } from "@/components/ui/badge";
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
import { useProductForm } from "@/hooks/useProductForm";
import type { ProductWithCurrentPrice } from "@/types/product";

interface ProductFormProps {
	isOpen: boolean;
	onClose: () => void;
	editProduct?: ProductWithCurrentPrice | null;
}

// Memoized form field component to prevent unnecessary re-renders
const FormField = React.memo<{
	id: string;
	label: string;
	children: React.ReactNode;
	error?: string;
}>(({ id, label, children, error }) => {
	return (
		<div className="space-y-2">
			<Label htmlFor={id} className="font-medium text-sm">
				{label}
			</Label>
			{children}
			{error && <p className="text-destructive text-sm">{error}</p>}
		</div>
	);
});

// Memoized profit analysis component
const ProfitAnalysis = React.memo<{
	analysis: NonNullable<ReturnType<typeof useProductForm>["profitAnalysis"]>;
}>(({ analysis }) => {
	const getStatusIcon = () => {
		switch (analysis.status) {
			case "excellent":
			case "good":
				return <TrendingUp className="h-4 w-4" />;
			case "poor":
			case "loss":
				return <TrendingDown className="h-4 w-4" />;
			default:
				return <Minus className="h-4 w-4" />;
		}
	};

	const getStatusText = () => {
		switch (analysis.status) {
			case "excellent":
				return "Excellent margin";
			case "good":
				return "Good margin";
			case "fair":
				return "Fair margin";
			case "poor":
				return "Low margin";
			case "loss":
				return "Loss";
		}
	};

	return (
		<>
			<Separator />
			<div className="space-y-3 rounded-lg bg-muted/50 p-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium text-foreground text-sm">
						Profit Analysis
					</h4>
					<Badge
						variant={
							analysis.status === "excellent" || analysis.status === "good"
								? "default"
								: "secondary"
						}
						className={`${analysis.color} gap-1`}
					>
						{getStatusIcon()}
						{getStatusText()}
					</Badge>
				</div>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Profit per unit:</span>
						<p className={`font-medium ${analysis.color}`}>
							{analysis.formatted.profit}
						</p>
					</div>
					<div>
						<span className="text-muted-foreground">Profit margin:</span>
						<p className={`font-medium ${analysis.color}`}>
							{analysis.formatted.margin}
						</p>
					</div>
				</div>
				<div className="text-muted-foreground text-xs">
					Revenue: {analysis.formatted.sellPrice} | Cost:{" "}
					{analysis.formatted.costPrice}
				</div>
			</div>
		</>
	);
});

export function ProductForm({
	isOpen,
	onClose,
	editProduct,
}: ProductFormProps) {
	const nameId = useId();
	const unitId = useId();
	const sellPriceId = useId();
	const costPriceId = useId();

	const {
		form,
		formMeta,
		isDesktop,
		profitAnalysis,
		validators,
		unitOptions,
		handleClose,
		handleSubmit,
	} = useProductForm({ editProduct, onClose });

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
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<Package className="h-5 w-5 text-primary" />
						</div>
						<div>
							<SheetTitle className="text-left font-semibold text-xl">
								{formMeta.title}
							</SheetTitle>
							<SheetDescription className="mt-1 text-left">
								{formMeta.description}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{/* Scrollable Content */}
				<ScrollArea className="min-h-0 flex-1">
					<div className="px-6 py-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Product Name */}
							<form.Field
								name="name"
								validators={{ onChange: validators.name }}
							>
								{(field) => (
									<FormField
										id={nameId}
										label="Product Name"
										error={field.state.meta.errors[0]}
									>
										<Input
											id={nameId}
											name="name"
											placeholder="e.g., Chakali, Bundi Ladoo"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											disabled={formMeta.isLoading}
											className="h-11"
										/>
									</FormField>
								)}
							</form.Field>

							{/* Unit of Measure */}
							<form.Field
								name="unit_of_measure"
								validators={{ onChange: validators.unit_of_measure }}
							>
								{(field) => (
									<FormField
										id={unitId}
										label="Unit of Measure"
										error={field.state.meta.errors[0]}
									>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
											disabled={formMeta.isLoading}
										>
											<SelectTrigger id={unitId} className="h-11">
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>
											<SelectContent>
												{unitOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormField>
								)}
							</form.Field>

							{/* Price Fields */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{/* Sell Price */}
								<form.Field
									name="sell_price"
									validators={{ onChange: validators.sell_price }}
								>
									{(field) => (
										<FormField
											id={sellPriceId}
											label="Sell Price (₹)"
											error={field.state.meta.errors[0]}
										>
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
												disabled={formMeta.isLoading}
												className="h-11"
											/>
										</FormField>
									)}
								</form.Field>

								{/* Cost Price */}
								<form.Field
									name="cost_price"
									validators={{ onChange: validators.cost_price }}
								>
									{(field) => (
										<FormField
											id={costPriceId}
											label="Cost Price (₹)"
											error={field.state.meta.errors[0]}
										>
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
												disabled={formMeta.isLoading}
												className="h-11"
											/>
										</FormField>
									)}
								</form.Field>
							</div>

							{/* Profit Analysis */}
							{profitAnalysis && <ProfitAnalysis analysis={profitAnalysis} />}
						</form>
					</div>
				</ScrollArea>

				{/* Sticky Footer Actions */}
				<div
					className={`shrink-0 border-border border-t bg-background px-6 py-4 ${!isDesktop && "pb-6"}
        `}
				>
					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={formMeta.isLoading}
							className="h-11 flex-1"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={formMeta.isLoading || !form.state.isValid}
							className="h-11 flex-1"
							onClick={handleSubmit}
						>
							{formMeta.isLoading ? formMeta.loadingText : formMeta.submitText}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
