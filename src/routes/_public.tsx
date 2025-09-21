import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
	component: PublicLayout,
	beforeLoad: async ({ context, location }) => {
		// Check if user is already authenticated
		const {
			data: { session },
		} = await import("../lib/supabase").then(({ supabase }) =>
			supabase.auth.getSession(),
		);

		if (session) {
			// If user is authenticated and trying to access login, redirect to dashboard
			throw redirect({
				to: "/dashboard",
			});
		}
	},
});

function PublicLayout() {
	return <Outlet />;
}
