import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
	beforeLoad: async ({ location }) => {
		const { session, user } = useAuthStore.getState();

		if (!session || !user) {
			console.log(
				"[_authenticated:beforeLoad] User is not authenticated, redirecting to `/login`",
			);
			throw redirect({
				to: "/login",
				search: {
					redirect: location.pathname,
				},
			});
		}

		console.log(
			"[_authenticated:beforeLoad] User is authenticated. ALlowing access.",
		);
	},
});

function AuthenticatedLayout() {
	return (
		<AppLayout>
			<Outlet />
		</AppLayout>
	);
}
