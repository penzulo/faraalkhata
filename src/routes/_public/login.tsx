import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { FormField } from "@/components/auth/FormField";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
	fullName: z
		.string({ required_error: "Full name is required." })
		.min(3, { message: "Name must be at least 3 characters long." })
		.max(50, { message: "Name cannot be more than 50 characters long." })
		.trim(),
	email: z
		.string({ required_error: "Email is required." })
		.min(1, { message: "Email is required." })
		.email("Please enter a valid email address")
		.trim(),
});

type LoginSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/_public/login")({
	component: LoginPage,
	validateSearch: (search: Record<string, unknown>): LoginSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
});

function LoginPage() {
	const { signInWithMagicLink, loading, error, clearError } = useAuth();
	const { redirect } = Route.useSearch();

	const form = useForm({
		defaultValues: {
			fullName: "",
			email: "",
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const redirectUrl =
					redirect && redirect !== "/login"
						? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
						: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/dashboard")}`;

				await signInWithMagicLink(value.email, value.fullName, redirectUrl);

				// Show success message - you can replace this with your toast system
				alert("Magic link sent! Please check your email.");
			} catch (error) {
				console.error("Login error:", error);
			}
		},
	});

	useEffect(() => {
		if (error) {
			// Clear error after 5 seconds
			const timer = setTimeout(clearError, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center font-extrabold text-3xl text-gray-900">
						Sign in to your account
					</h2>
				</div>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="mt-8 space-y-6"
				>
					<div>
						<form.Field name="email">
							{(field) => (
								<FormField
									field={field}
									label="Email Address"
									type="email"
									placeholder="Email Address"
									required
								/>
							)}
						</form.Field>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<div className="text-red-700 text-sm">{error}</div>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading || !form.state.isValid}
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
						>
							{loading ? (
								<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
							) : (
								"Send Magic Link"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// function EmailField({field}: {field: FieldApi}) {}
