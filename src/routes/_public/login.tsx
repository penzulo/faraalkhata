import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, Sparkles, User } from "lucide-react";
import { useEffect, useId } from "react";
import { toast } from "sonner";
import { useBoolean } from "usehooks-ts";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthError, useAuthLoading, useAuthStore } from "@/stores/auth";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	full_name: z
		.string()
		.min(2, "Full name should be of at least 2 characters.")
		.max(50, "Full name should be of at most 50 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/_public/login")({
	component: LoginPage,
	validateSearch: (search: Record<string, unknown>): LoginSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
});

function LoginPage() {
	const loading = useAuthLoading();
	const error = useAuthError();
	const { redirect } = Route.useSearch();
	const {
		value: isSubmitted,
		setTrue: submitLoginForm,
		setFalse: discardLoginForm,
	} = useBoolean();
	const fullNameId = useId();
	const emailId = useId();
	const form = useForm({
		defaultValues: {
			email: "",
			full_name: "",
		} as LoginFormData,
		onSubmit: async ({ value }) => {
			const redirectUrl =
				redirect && redirect !== "/login"
					? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
					: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/dashboard")}`;
			const promise = useAuthStore
				.getState()
				.signInWithLoginLink(value.email, redirectUrl, {
					data: {
						full_name: value.full_name,
					},
				});
			toast.promise(promise, {
				loading: "Sending login link...",
				success: () => {
					submitLoginForm();
					return "Login link sent! Please check your email.";
				},
				error: () => {
					discardLoginForm();
					return "Failed to send link. Please try again.";
				},
			});
		},
	});
	useEffect(() => {
		if (error) {
			const timer = setTimeout(useAuthStore.getState().clearError, 5000);
			return () => clearTimeout(timer);
		}
	}, [error]);
	if (isSubmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center space-y-4 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
								<Mail className="h-8 w-8 text-primary" />
							</div>
							<div>
								<h2 className="font-semibold text-2xl text-foreground">
									Check your email
								</h2>
								<p className="mt-2 text-muted-foreground">
									We've sent a login link to{" "}
									<strong>{form.state.values.email}</strong>
								</p>
							</div>
							<div className="space-y-2 text-muted-foreground text-sm">
								<p>Click the link in the email to sign in to your account.</p>
								<p>If you don't see the email, check your spam folder.</p>
							</div>
							<Button
								variant="outline"
								onClick={discardLoginForm}
								className="mt-4"
							>
								Send another link
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md space-y-6">
				{/* Brand Header */}
				<div className="space-y-4 text-center">
					<div className="flex justify-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-faraal-saffron to-faraal-gold shadow-lg">
							<Sparkles className="h-8 w-8 text-white" />
						</div>
					</div>
					<div>
						<h1 className="font-semibold text-3xl text-foreground">
							Welcome to FaraalKhata
						</h1>
						<p className="mt-2 text-muted-foreground">
							Your festive commerce companion
						</p>
					</div>
				</div>
				{/* Login Card */}
				<Card>
					<CardHeader>
						<CardTitle>Sign in to your account</CardTitle>
						<CardDescription>
							Enter your details to receive a magic link via email
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-4"
						>
							{/* Full Name Field */}
							<form.Field
								name="full_name"
								validators={{
									onChange: z
										.string()
										.min(2, "Full name should be of at least 2 characters")
										.max(50, "Full name should be of at most 50 characters"),
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={fullNameId}>Full Name</Label>
										<div className="relative">
											<User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
											<Input
												id={fullNameId}
												name="full_name"
												type="text"
												placeholder="Enter your full name"
												className="pl-10"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												disabled={loading}
											/>
										</div>
										{field.state.meta.errors?.[0] && (
											<p className="text-destructive text-sm">
												{field.state.meta.errors[0].message}
											</p>
										)}
									</div>
								)}
							</form.Field>
							{/* Email Field */}
							<form.Field
								name="email"
								validators={{
									onChange: z
										.string()
										.email("Please enter a valid email address"),
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={emailId}>Email Address</Label>
										<div className="relative">
											<Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
											<Input
												id={emailId}
												name="email"
												type="email"
												placeholder="Enter your email address"
												className="pl-10"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												disabled={loading}
											/>
										</div>
										{field.state.meta.errors?.[0] && (
											<p className="text-destructive text-sm">
												{field.state.meta.errors[0].message}
											</p>
										)}
									</div>
								)}
							</form.Field>
							{/* Error Alert */}
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							{/* Submit Button */}
							<Button
								type="submit"
								className="w-full"
								disabled={loading || !form.state.isValid}
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending Login Link...
									</>
								) : (
									<>
										<Mail className="mr-2 h-4 w-4" />
										Send Login Link
									</>
								)}
							</Button>
						</form>
						{/* Help Text */}
						<div className="mt-4 text-center">
							<p className="text-muted-foreground text-xs">
								By signing in, you agree to our terms of service and privacy
								policy.
								<br />
								Login links are valid for 24 hours.
							</p>
						</div>
					</CardContent>
				</Card>
				{/* Footer */}
				<div className="text-center text-muted-foreground text-sm">
					<p>
						New to FaraalKhata? Your account will be created automatically when
						you click the login link.
					</p>
				</div>
			</div>
		</div>
	);
}
