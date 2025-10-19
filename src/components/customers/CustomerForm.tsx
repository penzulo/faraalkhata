import { Phone, Tag, Users, X } from "lucide-react";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCustomerForm } from "@/hooks/useCustomerForm";
import type { CustomerWithCategories } from "@/types/customer";

interface CustomerFormProps {
	isOpen: boolean;
	onClose: () => void;
	editCustomer?: CustomerWithCategories | null;
}

export function CustomerForm({
	isOpen,
	onClose,
	editCustomer,
}: CustomerFormProps) {
	const {
		form,
		formMeta,
		isDesktop,
		customerInsights,
		categoryOptions,
		handleClose,
		handleSubmit,
		handlePhoneChange,
		toggleCategory,
	} = useCustomerForm({
		editCustomer,
		onClose,
	});

	const nameId = useId();
	const phoneId = useId();
	const notesId = useId();

	return (
		<Sheet open={isOpen} onOpenChange={handleClose}>
			<SheetContent
				side={isDesktop ? "right" : "bottom"}
				className={`${isDesktop ? "w-[500px] sm:max-w-[500px]" : "h-[90vh]"} dark:border-gray-800 dark:bg-gray-900`}
			>
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2 dark:text-gray-100">
						<Users className="h-5 w-5" />
						{formMeta.title}
					</SheetTitle>
					<SheetDescription className="dark:text-gray-400">
						{formMeta.description}
					</SheetDescription>
				</SheetHeader>

				<ScrollArea
					className={
						isDesktop ? "h-[calc(100vh-120px)]" : "h-[calc(90vh-120px)] pr-4"
					}
				>
					<form onSubmit={handleSubmit} className="space-y-6 py-4">
						{/* Customer Preview Card with dark mode */}
						{customerInsights && (
							<div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-900 dark:from-blue-950 dark:to-indigo-950">
								<div className="mb-3 flex items-center gap-3">
									<div
										className="flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white shadow-sm"
										style={{ backgroundColor: customerInsights.avatarColor }}
									>
										{customerInsights.initials}
									</div>
									<div className="flex-1">
										<div className="mb-1 flex items-center gap-2">
											<h4 className="font-medium text-gray-900 dark:text-gray-100">
												{form.state.values.name || "New Customer"}
											</h4>
											<Badge
												variant="outline"
												className={`${customerInsights.completionColor} dark:border-gray-600`}
											>
												{customerInsights.formatted.completion} complete
											</Badge>
										</div>
										<div className="space-y-1 text-gray-600 text-sm dark:text-gray-300">
											{customerInsights.formattedPhone && (
												<div className="flex items-center gap-1">
													<Phone className="h-3 w-3" />
													{customerInsights.formatted.phone}
												</div>
											)}
											<div className="flex items-center gap-1">
												<Tag className="h-3 w-3" />
												{customerInsights.formatted.categories}
											</div>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Customer Name Field with dark mode */}
						<form.Field
							name="name"
							validators={{
								onChange: ({ value }) => {
									if (!value || value.length < 2) {
										return "Customer name must be at least 2 characters";
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label
										htmlFor={nameId}
										className="font-medium text-sm dark:text-gray-200"
									>
										Customer Name *
									</Label>
									<Input
										id={nameId}
										placeholder="Enter customer name"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={field.state.meta.errors.length > 0}
										className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
									/>
									{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 && (
											<p
												className="text-red-500 text-sm dark:text-red-400"
												role="alert"
											>
												{field.state.meta.errors[0]}
											</p>
										)}
								</div>
							)}
						</form.Field>

						{/* Phone Number Field with dark mode */}
						<form.Field
							name="phone"
							validators={{
								onChange: ({ value }) => {
									const cleaned = value.replace(/\D/g, "");
									if (!cleaned) {
										return "Phone number is required";
									}
									if (!/^[6-9]\d{9}$/.test(cleaned)) {
										return "Please enter a valid 10-digit Indian mobile number";
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label
										htmlFor={phoneId}
										className="font-medium text-sm dark:text-gray-200"
									>
										Phone Number *
									</Label>
									<div className="relative">
										<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
											<span className="text-gray-500 text-sm dark:text-gray-400">
												+91
											</span>
										</div>
										<Input
											id={phoneId}
											type="tel"
											placeholder="98765 43210"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(handlePhoneChange(e.target.value))
											}
											onBlur={field.handleBlur}
											className="pl-12 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
											maxLength={10}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
									</div>
									{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 ? (
										<p
											className="text-red-500 text-sm dark:text-red-400"
											role="alert"
										>
											{field.state.meta.errors[0]}
										</p>
									) : (
										field.state.value &&
										customerInsights?.isPhoneValid && (
											<p className="mt-1 text-green-600 text-xs dark:text-green-400">
												✓ Valid Indian mobile number
											</p>
										)
									)}
								</div>
							)}
						</form.Field>

						{/* Categories Field with dark mode */}
						<form.Field name="category_ids">
							{(field) => (
								<div className="space-y-2">
									<Label className="font-medium text-sm dark:text-gray-200">
										Categories (Optional)
									</Label>
									<div className="space-y-3">
										<p className="text-gray-500 text-sm dark:text-gray-400">
											Select categories that best describe this customer
										</p>

										{/* Category Options Grid with dark mode */}
										<div
											className={`grid gap-2 ${isDesktop ? "grid-cols-2" : "grid-cols-1"}`}
										>
											{categoryOptions.map((category) => {
												const isSelected = field.state.value.includes(
													category.value,
												);
												return (
													<button
														key={category.value}
														type="button"
														className={`flex items-center space-x-2 rounded-lg border-2 p-3 text-left transition-colors ${
															isSelected
																? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
																: "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
														}`}
														onClick={() => toggleCategory(category.value)}
														aria-pressed={isSelected}
													>
														<div
															className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
																isSelected
																	? "border-blue-500 bg-blue-500 dark:border-blue-600 dark:bg-blue-600"
																	: "border-gray-300 dark:border-gray-600"
															}`}
														>
															{isSelected && (
																<svg
																	className="h-3 w-3 text-white"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																	aria-hidden="true"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={3}
																		d="M5 13l4 4L19 7"
																	/>
																</svg>
															)}
														</div>
														<span className="flex-1 font-medium text-sm dark:text-gray-200">
															{category.label}
														</span>
													</button>
												);
											})}
										</div>

										{/* Selected Categories Preview with dark mode */}
										{field.state.value.length > 0 && (
											<div className="mt-3 flex flex-wrap gap-2">
												{field.state.value.map((categoryId) => {
													const category = categoryOptions.find(
														(cat) => cat.value === categoryId,
													);
													if (!category) return null;
													return (
														<Badge
															key={categoryId}
															variant="secondary"
															className="flex items-center gap-1 dark:bg-gray-700 dark:text-gray-200"
														>
															{category.label}
															<button
																type="button"
																onClick={() => toggleCategory(categoryId)}
																className="ml-1"
																aria-label={`Remove ${category.label}`}
															>
																<X className="h-3 w-3 cursor-pointer hover:text-red-500 dark:hover:text-red-400" />
															</button>
														</Badge>
													);
												})}
											</div>
										)}
									</div>
								</div>
							)}
						</form.Field>

						{/* Notes Field with dark mode */}
						<form.Field
							name="notes"
							validators={{
								onChange: ({ value }) => {
									if (value && value.length > 500) {
										return "Notes should be less than 500 characters";
									}
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label
										htmlFor={notesId}
										className="font-medium text-sm dark:text-gray-200"
									>
										Notes (Optional)
									</Label>
									<Textarea
										id={notesId}
										placeholder="Add any additional notes about this customer..."
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										rows={3}
										maxLength={500}
										aria-invalid={field.state.meta.errors.length > 0}
										className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
									/>
									<p className="mt-1 text-gray-400 text-xs dark:text-gray-500">
										{field.state.value?.length || 0}/500 characters
									</p>
									{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 && (
											<p
												className="text-red-500 text-sm dark:text-red-400"
												role="alert"
											>
												{field.state.meta.errors[0]}
											</p>
										)}
								</div>
							)}
						</form.Field>

						<Separator className="dark:bg-gray-700" />

						{/* Form Actions */}
						<div
							className={`flex gap-3 ${isDesktop ? "flex-row" : "flex-col-reverse"}`}
						>
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								disabled={formMeta.isLoading}
								className={`${isDesktop ? "flex-1" : "w-full"} dark:border-gray-700 dark:hover:bg-gray-800`}
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
								className={isDesktop ? "flex-1" : "w-full"}
							>
								{formMeta.isLoading
									? formMeta.loadingText
									: formMeta.submitText}
							</Button>
						</div>
					</form>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
