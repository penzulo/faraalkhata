import {
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	Package,
	ShoppingCart,
	Users,
	X,
} from "lucide-react";
import { useId } from "react";
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
import { Separator } from "@/components/ui/separator";
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

	const steps = [
		{ number: 1, title: "Customer", icon: Users },
		{ number: 2, title: "Products", icon: Package },
		{ number: 3, title: "Review", icon: CheckCircle },
	];

	if (!isOpen) return null;

	return (
		<>
			{/* Full Page Modal Overlay */}
			<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
				{/* Modal Container */}
				<div className="fixed inset-0 flex items-center justify-center p-4">
					<div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
						{/* Header */}
						<div className="flex flex-shrink-0 items-center justify-between border-b bg-white px-6 py-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
									<ShoppingCart className="h-5 w-5 text-orange-600" />
								</div>
								<div>
									<h2 className="font-semibold text-lg">{formMeta.title}</h2>
									<p className="text-gray-600 text-sm">
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
							</Button>
						</div>

						{/* Progress Indicator */}
						<div className="flex-shrink-0 border-b bg-gray-50 px-6 py-6">
							<div className="flex items-center justify-between">
								{steps.map((step, index) => {
									const StepIcon = step.icon;
									const isActive = currentStep === step.number;
									const isCompleted = currentStep > step.number;

									return (
										<div key={step.number} className="flex flex-1 items-center">
											<button
												type="button"
												onClick={() => goToStep(step.number)}
												className={`flex flex-col items-center gap-2 ${
													isActive || isCompleted
														? "cursor-pointer"
														: "cursor-not-allowed opacity-50"
												}`}
												disabled={!isActive && !isCompleted}
											>
												<div
													className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
														isCompleted
															? "border-green-500 bg-green-500 text-white"
															: isActive
																? "border-orange-500 bg-orange-500 text-white"
																: "border-gray-300 bg-white text-gray-400"
													}`}
												>
													<StepIcon className="h-6 w-6" />
												</div>
												<span
													className={`font-medium text-sm ${
														isActive
															? "text-orange-600"
															: isCompleted
																? "text-green-600"
																: "text-gray-500"
													}`}
												>
													{step.title}
												</span>
											</button>

											{index < steps.length - 1 && (
												<div
													className={`mx-4 h-1 flex-1 rounded-full transition-all ${
														isCompleted ? "bg-green-500" : "bg-gray-300"
													}`}
												/>
											)}
										</div>
									);
								})}
							</div>
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
									validators={validators}
									orderCalculations={orderCalculations}
									addProduct={addProduct}
									removeProduct={removeProduct}
									updateProductQuantity={updateProductQuantity}
									handleSubmit={handleSubmit}
								/>
							</div>

							{/* Sidebar - Order Summary (visible on step 2+) */}
							{currentStep >= 2 && (
								<div className="w-80 flex-shrink-0 border-l bg-gray-50 p-6">
									<h3 className="mb-4 font-semibold text-lg">Order Summary</h3>
									<Card className="bg-white p-4">
										<div className="space-y-3">
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">Items</span>
												<span className="font-medium">
													{orderCalculations.itemCount}
												</span>
											</div>
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">Subtotal</span>
												<span className="font-medium">
													{orderUtils.formatCurrency(
														orderCalculations.subtotal,
													)}
												</span>
											</div>
											{orderCalculations.discount > 0 && (
												<div className="flex items-center justify-between text-green-600 text-sm">
													<span>Discount</span>
													<span>
														-
														{orderUtils.formatCurrency(
															orderCalculations.discount,
														)}
													</span>
												</div>
											)}
											{orderCalculations.deliveryFee > 0 && (
												<div className="flex items-center justify-between text-sm">
													<span className="text-gray-600">Delivery Fee</span>
													<span className="font-medium">
														{orderUtils.formatCurrency(
															orderCalculations.deliveryFee,
														)}
													</span>
												</div>
											)}
											<Separator className="my-2" />
											<div className="flex items-center justify-between">
												<span className="font-semibold text-base">Total</span>
												<span className="font-bold text-orange-600 text-xl">
													{orderUtils.formatCurrency(orderCalculations.total)}
												</span>
											</div>
										</div>
									</Card>
								</div>
							)}
						</div>

						{/* Footer - Action Buttons */}
						<div className="flex-shrink-0 border-t bg-white px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="text-gray-600 text-sm">
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
											disabled={formMeta.isLoading || !form.state.canSubmit}
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

function OrderFormContent({
	form,
	currentStep,
	customers,
	products,
	referralPartners,
	validators,
	orderCalculations,
	addProduct,
	removeProduct,
	updateProductQuantity,
	handleSubmit,
}: any) {
	const formId = useId();

	return (
		<form onSubmit={handleSubmit} id={formId} className="h-full">
			<div className="mx-auto max-w-2xl">
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
			</div>
		</form>
	);
}
