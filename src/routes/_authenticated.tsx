import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
	beforeLoad: async ({ context, location }) => {
		// This will be called during SSR and client-side navigation
		const currentPath = location.pathname;

		// Check if we have a valid session
		const {
			data: { session },
		} =
			(await context.queryClient.getQueryData(["auth-session"])) ||
			(await import("../lib/supabase").then(({ supabase }) =>
				supabase.auth.getSession(),
			));

		if (!session) {
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
	const { loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
			</div>
		);
	}

	return <Outlet />;
}
