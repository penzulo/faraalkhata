import {
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	Package,
	ShoppingCart,
	Users,
	X,
} from "lucide-react";
import { memo, useId } from "react";
import { useBoolean } from "usehooks-ts";
import { Step1Customer } from "@/components/orders/Step1Customer";
import { Step2Products } from "@/components/orders/Step2Products";
import { Step3Review } from "@/components/orders/Step3Review";
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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	type StepNumber,
	type UseOrderFormReturn,
	useOrderForm,
} from "@/hooks/useOrderForm";
import { orderUtils } from "@/lib/api/orders";
import type { OrderWithRelations } from "@/types/order";

interface OrderFormProps {
	isOpen: boolean;
	onClose: () => void;
	editOrder?: OrderWithRelations | null;
}

type OrderFormContentProps = Pick<
	UseOrderFormReturn,
	| "form"
	| "currentStep"
	| "customers"
	| "products"
	| "referralPartners"
	| "orderCalculations"
	| "addProduct"
	| "removeProduct"
	| "updateProductQuantity"
	| "handleSubmit"
>;

const StepIndicator = memo<{
	steps: UseOrderFormReturn["steps"];
	currentStep: number;
	onStepClick: (step: StepNumber) => void;
}>(({ steps, currentStep, onStepClick }) => {
	const getStepIcon = (stepKey: string) => {
		switch (stepKey) {
			case "customer":
				return Users;
			case "products":
				return Package;
			case "review":
				return CheckCircle;
			default:
				return CheckCircle;
		}
	};

	return (
		<div className="flex w-full items-center">
			{steps.map((step, index) => {
				const StepIcon = getStepIcon(step.key);
				const isActive = currentStep === step.number;
				const isCompleted = currentStep > step.number;

				return (
					<div
						key={step.number}
						className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
					>
						{/* Step Button */}
						<button
							type="button"
							onClick={() => onStepClick(step.number)}
							className={`flex flex-col items-center gap-2 ${
								isActive || isCompleted
									? "cursor-pointer"
									: "cursor-not-allowed opacity-50"
							}`}
							disabled={!isActive && !isCompleted}
							aria-label={`${step.title} step`}
							aria-current={isActive ? "step" : undefined}
						>
							<div
								className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
									isCompleted
										? "border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-500"
										: isActive
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-card text-muted-foreground"
								}`}
							>
								<StepIcon className="h-6 w-6" />
							</div>
							<span
								className={`font-medium text-sm ${
									isActive
										? "text-primary"
										: isCompleted
											? "text-green-600 dark:text-green-400"
											: "text-muted-foreground"
								}`}
							>
								{step.title}
							</span>
						</button>

						{/* Connector Line */}
						{index < steps.length - 1 && (
							<div className="mx-4 h-1 flex-1 rounded-full bg-border transition-all">
								<div
									className={`h-full rounded-full transition-all ${
										isCompleted
											? "w-full bg-green-600 dark:bg-green-500"
											: "w-0"
									}`}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
});

StepIndicator.displayName = "StepIndicator";

const OrderSummary = memo<{
	orderCalculations: UseOrderFormReturn["orderCalculations"];
}>(({ orderCalculations }) => (
	<div className="w-80 flex-shrink-0 border-l bg-muted/30 p-6">
		<h3 className="mb-4 font-semibold text-foreground text-lg">
			Order Summary
		</h3>
		<Card className="p-4">
			<div className="space-y-3">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Items</span>
					<span className="font-medium text-foreground">
						{orderCalculations.itemCount}
					</span>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Subtotal</span>
					<span className="font-medium text-foreground">
						{orderUtils.formatCurrency(orderCalculations.subtotal)}
					</span>
				</div>
				{orderCalculations.discount > 0 && (
					<div className="flex items-center justify-between text-green-600 text-sm dark:text-green-400">
						<span>Discount</span>
						<span>
							-{orderUtils.formatCurrency(orderCalculations.discount)}
						</span>
					</div>
				)}
				{orderCalculations.deliveryFee > 0 && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Delivery Fee</span>
						<span className="font-medium text-foreground">
							{orderUtils.formatCurrency(orderCalculations.deliveryFee)}
						</span>
					</div>
				)}
				<Separator className="my-2" />
				<div className="flex items-center justify-between">
					<span className="font-semibold text-base text-foreground">Total</span>
					<span className="font-bold text-primary text-xl">
						{orderUtils.formatCurrency(orderCalculations.total)}
					</span>
				</div>
			</div>
		</Card>
	</div>
));

OrderSummary.displayName = "OrderSummary";

export function OrderForm({ isOpen, onClose, editOrder }: OrderFormProps) {
	const {
		value: showDiscardDialog,
		setTrue: openDiscardDialog,
		setFalse: closeDiscardDialog,
	} = useBoolean();

	const {
		form,
		formMeta,
		currentStep,
		totalSteps,
		steps,
		customers,
		products,
		referralPartners,
		orderCalculations,
		canGoNext,
		goToNextStep,
		goToPrevStep,
		goToStep,
		addProduct,
		removeProduct,
		updateProductQuantity,
		handleClose,
		handleSubmit,
	} = useOrderForm({
		editOrder,
		onClose,
	});

	const handleCloseAttempt = () => {
		const hasData =
			form.state.values.customer_id || form.state.values.items.length > 0;

		if (hasData && !formMeta.isEditing) {
			openDiscardDialog();
		} else {
			handleClose();
		}
	};

	const confirmDiscard = () => {
		closeDiscardDialog();
		handleClose();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Full Page Modal Overlay */}
			<div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
				{/* Modal Container */}
				<div className="fixed inset-0 flex items-center justify-center p-4">
					<div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg border bg-card shadow-2xl">
						{/* Header */}
						<div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<ShoppingCart className="h-5 w-5 text-primary" />
								</div>
								<div>
									<h2 className="font-semibold text-foreground text-lg">
										{formMeta.title}
									</h2>
									<p className="text-muted-foreground text-sm">
										{formMeta.description}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleCloseAttempt}
								className="rounded-full"
							>
								<X className="h-5 w-5" />
								<span className="sr-only">Close</span>
							</Button>
						</div>

						{/* Progress Indicator */}
						<div className="flex-shrink-0 border-b bg-muted/30 px-6 py-6">
							<StepIndicator
								steps={steps}
								currentStep={currentStep}
								onStepClick={goToStep}
							/>
						</div>

						{/* Content Area - Scrollable */}
						<div className="flex flex-1 overflow-hidden">
							{/* Main Form Content */}
							<div className="flex-1 overflow-y-auto p-6">
								<OrderFormContent
									form={form}
									currentStep={currentStep}
									customers={customers}
									products={products}
									referralPartners={referralPartners}
									orderCalculations={orderCalculations}
									addProduct={addProduct}
									removeProduct={removeProduct}
									updateProductQuantity={updateProductQuantity}
									handleSubmit={handleSubmit}
								/>
							</div>

							{/* Sidebar - Order Summary (visible on step 2+) */}
							{currentStep >= 2 && (
								<OrderSummary orderCalculations={orderCalculations} />
							)}
						</div>

						{/* Footer - Action Buttons */}
						<div className="flex-shrink-0 border-t bg-card px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="text-muted-foreground text-sm">
									Step {currentStep} of {totalSteps}
								</div>
								<div className="flex gap-3">
									{currentStep > 1 && (
										<Button
											type="button"
											variant="outline"
											onClick={goToPrevStep}
											size="lg"
										>
											<ArrowLeft className="mr-2 h-4 w-4" />
											Back
										</Button>
									)}

									{currentStep < totalSteps ? (
										<Button
											type="button"
											onClick={goToNextStep}
											disabled={!canGoNext}
											size="lg"
											className="min-w-[120px]"
										>
											Next
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
									) : (
										<Button
											type="submit"
											onClick={handleSubmit}
											disabled={
												formMeta.isLoading ||
												!form.state.canSubmit ||
												form.state.isSubmitting
											}
											size="lg"
											className="min-w-[120px]"
										>
											{formMeta.isLoading
												? formMeta.loadingText
												: formMeta.submitText}
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Discard Confirmation Dialog */}
			<AlertDialog open={showDiscardDialog} onOpenChange={closeDiscardDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Discard order?</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to discard this
							order?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Continue editing</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDiscard}>
							Discard
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

const OrderFormContent = memo<OrderFormContentProps>(
	({
		form,
		currentStep,
		customers,
		products,
		referralPartners,
		orderCalculations,
		addProduct,
		removeProduct,
		updateProductQuantity,
		handleSubmit,
	}) => {
		const formId = useId();

		return (
			<form onSubmit={handleSubmit} id={formId} className="h-full">
				<div className="mx-auto max-w-2xl">
					{currentStep === 1 && (
						<Step1Customer
							form={form}
							customers={customers}
							referralPartners={referralPartners}
						/>
					)}

					{currentStep === 2 && (
						<Step2Products
							form={form}
							products={products}
							addProduct={addProduct}
							removeProduct={removeProduct}
							updateProductQuantity={updateProductQuantity}
						/>
					)}

					{currentStep === 3 && (
						<Step3Review
							form={form}
							customers={customers}
							products={products}
							orderCalculations={orderCalculations}
						/>
					)}
				</div>
			</form>
		);
	},
);

OrderFormContent.displayName = "OrderFormContent";
