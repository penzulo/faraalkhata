import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
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

				await signInWithMagicLink(value.email, redirectUrl);

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
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
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
						<form.Field
							name="email"
							children={(field) => (
								<div>
									<label htmlFor="email" className="sr-only">
										Email address
									</label>
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
										placeholder="Email address"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors?.[0] && (
										<p className="mt-1 text-sm text-red-600">
											{field.state.meta.errors[0].message}
										</p>
									)}
								</div>
							)}
						/>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<div className="text-sm text-red-700">{error}</div>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading || !form.state.isValid}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
						>
							{loading ? (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
