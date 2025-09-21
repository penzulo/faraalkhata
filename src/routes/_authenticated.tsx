import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
	beforeLoad: async ({ location }) => {
		const currentPath = location.pathname;

		try {
			// Check if we have a valid session
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();

			if (error || !session) {
				throw redirect({
					to: "/login",
					search: {
						redirect: currentPath !== "/login" ? currentPath : "/dashboard",
					},
				});
			}
		} catch (redirectError) {
			// Re-throw redirect errors
			if (
				redirectError &&
				typeof redirectError === "object" &&
				"redirect" in redirectError
			) {
				throw redirectError;
			}

			// For other errors, redirect to login
			throw redirect({
				to: "/login",
				search: {
					redirect: currentPath !== "/login" ? currentPath : "/dashboard",
				},
			});
		}
	},
});

function AuthenticatedLayout() {
	const { loading, user } = useAuth();

	// Only show loading if we don't have a user and we're actually loading
	if (loading && !user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
			</div>
		);
	}

	return <Outlet />;
}
