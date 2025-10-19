import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/_public")({
	component: PublicLayout,
	beforeLoad: async () => {
		const { session, user } = useAuthStore.getState();

		if (!!session && !!user) {
			console.log(
				"[_public:beforeLoad] User is authenticated, redirecting to `/dashboard`",
			);
			throw redirect({
				to: "/dashboard",
			});
		}

		console.log(
			"[_public:beforeLoad] User is not authenticated. ALlowing access.",
		);
	},
});

function PublicLayout() {
	return <Outlet />;
}
