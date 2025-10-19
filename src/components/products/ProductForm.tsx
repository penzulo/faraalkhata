import { Minus, Package, TrendingDown, TrendingUp } from "lucide-react";
import { memo, useId } from "react";
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
import {
	type UseProductFormReturn,
	useProductForm,
} from "@/hooks/useProductForm";
import type { ProductWithCurrentPrice } from "@/types/product";

interface ProductFormProps {
	isOpen: boolean;
	onClose: () => void;
	editProduct?: ProductWithCurrentPrice | null;
}

const ProfitAnalysis = memo<{
	analysis: NonNullable<UseProductFormReturn["profitAnalysis"]>;
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
				return "Loss - Losing money";
			default:
				return "Unknown";
		}
	};

	const getBadgeVariant = () => {
		return analysis.status === "excellent" || analysis.status === "good"
			? "default"
			: "secondary";
	};

	return (
		<>
			<Separator />
			<div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
				<div className="flex items-center justify-between">
					<h4 className="font-medium text-foreground text-sm">
						Profit Analysis
					</h4>
					<Badge
						variant={getBadgeVariant()}
						className={`${analysis.color} gap-1`}
					>
						{getStatusIcon()}
						{getStatusText()}
					</Badge>
				</div>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-muted-foreground">Profit per unit:</span>
						<p className={`font-semibold ${analysis.color}`}>
							{analysis.formatted.profit}
						</p>
					</div>
					<div>
						<span className="text-muted-foreground">Profit margin:</span>
						<p className={`font-semibold ${analysis.color}`}>
							{analysis.formatted.margin}
						</p>
					</div>
				</div>
				<div className="text-muted-foreground text-xs">
					<span className="font-medium">Revenue:</span>{" "}
					{analysis.formatted.sellPrice} <span className="mx-1">•</span>
					<span className="font-medium">Cost:</span>{" "}
					{analysis.formatted.costPrice}
				</div>
			</div>
		</>
	);
});

ProfitAnalysis.displayName = "ProfitAnalysis";

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
		unitOptions,
		handleClose,
		handleSubmit,
	} = useProductForm({ editProduct, onClose });

	return (
		<Sheet open={isOpen} onOpenChange={handleClose}>
			<SheetContent
				side={isDesktop ? "right" : "bottom"}
				className={`flex flex-col p-0 ${
					isDesktop
						? "h-full w-[480px] sm:max-w-[480px]"
						: "h-[90vh] max-h-[90vh] w-full"
				}`}
			>
				{/* Header with dark mode support */}
				<SheetHeader className="shrink-0 border-b px-6 py-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<Package className="h-5 w-5 text-primary" />
						</div>
						<div>
							<SheetTitle className="text-left font-semibold text-foreground text-xl">
								{formMeta.title}
							</SheetTitle>
							<SheetDescription className="mt-1 text-left text-muted-foreground">
								{formMeta.description}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{/* Scrollable Content */}
				<ScrollArea className="min-h-0 flex-1">
					<div className="px-6 py-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Product Name with dark mode */}
							<form.Field
								name="name"
								validators={{
									onChange: ({ value }) => {
										if (!value || value.length < 2) {
											return "Product name must be at least 2 characters";
										}
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label
											htmlFor={nameId}
											className="font-medium text-foreground text-sm"
										>
											Product Name *
										</Label>
										<Input
											id={nameId}
											placeholder="e.g., Chakali, Bundi Ladoo"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											disabled={formMeta.isLoading}
											className="h-11"
											aria-invalid={field.state.meta.errors.length > 0}
										/>
										{field.state.meta.isTouched &&
											field.state.meta.errors.length > 0 && (
												<p className="text-destructive text-sm" role="alert">
													{field.state.meta.errors[0]}
												</p>
											)}
									</div>
								)}
							</form.Field>

							{/* Unit of Measure with dark mode */}
							<form.Field
								name="unit_of_measure"
								validators={{
									onChange: ({ value }) => {
										if (!value) {
											return "Please select a unit of measure";
										}
										return undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label
											htmlFor={unitId}
											className="font-medium text-foreground text-sm"
										>
											Unit of Measure *
										</Label>
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
										{field.state.meta.isTouched &&
											field.state.meta.errors.length > 0 && (
												<p className="text-destructive text-sm" role="alert">
													{field.state.meta.errors[0]}
												</p>
											)}
									</div>
								)}
							</form.Field>

							{/* Price Fields with dark mode */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{/* Sell Price */}
								<form.Field
									name="sell_price"
									validators={{
										onChange: ({ value }) => {
											if (!value || value <= 0) {
												return "Must be greater than 0";
											}
											if (value > 999999.99) {
												return "Value too high";
											}
											return undefined;
										},
									}}
								>
									{(field) => (
										<div className="space-y-2">
											<Label
												htmlFor={sellPriceId}
												className="font-medium text-foreground text-sm"
											>
												Sell Price (₹) *
											</Label>
											<div className="relative">
												<span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground text-sm">
													₹
												</span>
												<Input
													id={sellPriceId}
													type="number"
													step="0.01"
													min="0"
													max="999999.99"
													placeholder="0.00"
													value={field.state.value || ""}
													onChange={(e) => {
														const val = e.target.value;
														field.handleChange(val ? Number(val) : 0);
													}}
													onBlur={field.handleBlur}
													disabled={formMeta.isLoading}
													className="h-11 pl-7"
													aria-invalid={field.state.meta.errors.length > 0}
												/>
											</div>
											{field.state.meta.isTouched &&
												field.state.meta.errors.length > 0 && (
													<p className="text-destructive text-sm" role="alert">
														{field.state.meta.errors[0]}
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
											if (!value || value <= 0) {
												return "Must be greater than 0";
											}
											if (value > 999999.99) {
												return "Value too high";
											}
											return undefined;
										},
									}}
								>
									{(field) => (
										<div className="space-y-2">
											<Label
												htmlFor={costPriceId}
												className="font-medium text-foreground text-sm"
											>
												Cost Price (₹) *
											</Label>
											<div className="relative">
												<span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground text-sm">
													₹
												</span>
												<Input
													id={costPriceId}
													type="number"
													step="0.01"
													min="0"
													max="999999.99"
													placeholder="0.00"
													value={field.state.value || ""}
													onChange={(e) => {
														const val = e.target.value;
														field.handleChange(val ? Number(val) : 0);
													}}
													onBlur={field.handleBlur}
													disabled={formMeta.isLoading}
													className="h-11 pl-7"
													aria-invalid={field.state.meta.errors.length > 0}
												/>
											</div>
											{field.state.meta.isTouched &&
												field.state.meta.errors.length > 0 && (
													<p className="text-destructive text-sm" role="alert">
														{field.state.meta.errors[0]}
													</p>
												)}
										</div>
									)}
								</form.Field>
							</div>

							{/* Profit Analysis */}
							{profitAnalysis && <ProfitAnalysis analysis={profitAnalysis} />}
						</form>
					</div>
				</ScrollArea>

				{/* Sticky Footer Actions with dark mode */}
				<div
					className={`shrink-0 border-t bg-card px-6 py-4 ${
						!isDesktop && "pb-6"
					}`}
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
							disabled={
								formMeta.isLoading ||
								!form.state.canSubmit ||
								form.state.isSubmitting
							}
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
