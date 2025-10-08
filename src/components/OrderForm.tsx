import {
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	Package,
	ShoppingCart,
	Users,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useOrderForm } from "@/hooks/useOrderForm";
import { orderUtils } from "@/lib/api/orders";
import type { OrderWithRelations } from "@/types/order";
import { Step1Customer } from "./order-form/Step1Customer";
import { Step2Products } from "./order-form/Step2Products";
import { Step3Review } from "./order-form/Step3Review";

interface OrderFormProps {
	isOpen: boolean;
	onClose: () => void;
	editOrder?: OrderWithRelations | null;
}

export function OrderForm({ isOpen, onClose, editOrder }: OrderFormProps) {
	const {
		value: showDiscardDialog,
		setTrue: openDiscardDialog,
		setFalse: closeDiscardDialog,
	} = useBoolean();

	const {
		form,
		formMeta,
		isDesktop,
		currentStep,
		totalSteps,
		customers,
		products,
		referralPartners,
		validators,
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
		// Show warning if form has data
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

	// Progress steps
	const steps = [
		{ number: 1, title: "Customer", icon: Users },
		{ number: 2, title: "Products", icon: Package },
		{ number: 3, title: "Review", icon: CheckCircle },
	];

	return (
		<>
			{isDesktop ? (
				// Desktop: Right-side sheet
				<Sheet open={isOpen} onOpenChange={handleCloseAttempt}>
					<SheetContent
						side="right"
						className="flex w-[600px] flex-col p-0 sm:max-w-[600px]"
					>
						<OrderFormContent
							form={form}
							formMeta={formMeta}
							currentStep={currentStep}
							totalSteps={totalSteps}
							steps={steps}
							customers={customers}
							products={products}
							referralPartners={referralPartners}
							validators={validators}
							orderCalculations={orderCalculations}
							canGoNext={canGoNext}
							goToNextStep={goToNextStep}
							goToPrevStep={goToPrevStep}
							goToStep={goToStep}
							addProduct={addProduct}
							removeProduct={removeProduct}
							updateProductQuantity={updateProductQuantity}
							handleSubmit={handleSubmit}
							handleClose={handleCloseAttempt}
							isDesktop={true}
						/>
					</SheetContent>
				</Sheet>
			) : (
				// Mobile: Full-screen overlay
				<div
					className={`fixed inset-0 z-50 bg-white transition-transform duration-300 ${
						isOpen ? "translate-y-0" : "translate-y-full"
					}`}
				>
					<OrderFormContent
						form={form}
						formMeta={formMeta}
						currentStep={currentStep}
						totalSteps={totalSteps}
						steps={steps}
						customers={customers}
						products={products}
						referralPartners={referralPartners}
						validators={validators}
						orderCalculations={orderCalculations}
						canGoNext={canGoNext}
						goToNextStep={goToNextStep}
						goToPrevStep={goToPrevStep}
						goToStep={goToStep}
						addProduct={addProduct}
						removeProduct={removeProduct}
						updateProductQuantity={updateProductQuantity}
						handleSubmit={handleSubmit}
						handleClose={handleCloseAttempt}
						isDesktop={false}
					/>
				</div>
			)}

			{/* Discard confirmation dialog */}
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

// Extracted content component for reusability
function OrderFormContent({
	form,
	formMeta,
	currentStep,
	totalSteps,
	steps,
	customers,
	products,
	referralPartners,
	validators,
	orderCalculations,
	canGoNext,
	goToNextStep,
	goToPrevStep,
	goToStep,
	addProduct,
	removeProduct,
	updateProductQuantity,
	handleSubmit,
	handleClose,
}: any) {
	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b px-6 py-4">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ShoppingCart className="h-5 w-5" />
						<h2 className="font-semibold text-lg">{formMeta.title}</h2>
					</div>
					<Button variant="ghost" size="sm" onClick={handleClose}>
						✕
					</Button>
				</div>

				{/* Progress Indicator */}
				<div className="flex items-center justify-between">
					{steps.map((step, index: number) => {
						const StepIcon = step.icon;
						const isActive = currentStep === step.number;
						const isCompleted = currentStep > step.number;

						return (
							<div key={step.number} className="flex flex-1 items-center">
								<button
									type="button"
									onClick={() => goToStep(step.number)}
									className={`flex flex-col items-center gap-1 ${
										isActive || isCompleted
											? "cursor-pointer"
											: "cursor-not-allowed opacity-50"
									}`}
									disabled={!isActive && !isCompleted}
								>
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
											isCompleted
												? "border-green-500 bg-green-500 text-white"
												: isActive
													? "border-orange-500 bg-orange-500 text-white"
													: "border-gray-300 bg-gray-100 text-gray-400"
										}`}
									>
										<StepIcon className="h-5 w-5" />
									</div>
									<span
										className={`font-medium text-xs ${
											isActive ? "text-orange-600" : "text-gray-500"
										}`}
									>
										{step.title}
									</span>
								</button>

								{index < steps.length - 1 && (
									<div
										className={`mx-2 h-0.5 flex-1 ${
											isCompleted ? "bg-green-500" : "bg-gray-300"
										}`}
									/>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Step Content */}
			<ScrollArea className="flex-1 px-6 py-4">
				<form onSubmit={handleSubmit}>
					{currentStep === 1 && (
						<Step1Customer
							form={form}
							customers={customers}
							referralPartners={referralPartners}
							validators={validators}
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
				</form>
			</ScrollArea>

			{/* Footer with navigation */}
			<div className="border-t bg-gray-50 px-6 py-4">
				{/* Order Summary */}
				<Card className="mb-4 bg-white p-4">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="text-gray-600">Items</span>
						<span className="font-medium">{orderCalculations.itemCount}</span>
					</div>
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="text-gray-600">Subtotal</span>
						<span className="font-medium">
							{orderUtils.formatCurrency(orderCalculations.subtotal)}
						</span>
					</div>
					{orderCalculations.discount > 0 && (
						<div className="mb-2 flex items-center justify-between text-green-600 text-sm">
							<span>Discount</span>
							<span>
								-{orderUtils.formatCurrency(orderCalculations.discount)}
							</span>
						</div>
					)}
					{orderCalculations.deliveryFee > 0 && (
						<div className="mb-2 flex items-center justify-between text-sm">
							<span className="text-gray-600">Delivery Fee</span>
							<span className="font-medium">
								{orderUtils.formatCurrency(orderCalculations.deliveryFee)}
							</span>
						</div>
					)}
					<Separator className="my-2" />
					<div className="flex items-center justify-between">
						<span className="font-semibold">Total</span>
						<span className="font-bold text-lg text-orange-600">
							{orderUtils.formatCurrency(orderCalculations.total)}
						</span>
					</div>
				</Card>

				{/* Navigation Buttons */}
				<div className="flex gap-3">
					{currentStep > 1 && (
						<Button
							type="button"
							variant="outline"
							onClick={goToPrevStep}
							className="flex-1"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
					)}

					{currentStep < totalSteps ? (
						<Button
							type="button"
							onClick={goToNextStep}
							disabled={!canGoNext()}
							className="flex-1"
						>
							Next
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					) : (
						<Button
							type="submit"
							onClick={handleSubmit}
							disabled={formMeta.isLoading || !form.state.canSubmit}
							className="flex-1"
						>
							{formMeta.isLoading ? formMeta.loadingText : formMeta.submitText}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
