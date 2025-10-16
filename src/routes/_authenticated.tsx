import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";
import {
	useAuthLoading,
	useAuthStore,
	useIsAuthenticated,
} from "@/stores/auth";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
	beforeLoad: async ({ location }) => {
		const currentPath = location.pathname;

		try {
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
			if (
				redirectError &&
				typeof redirectError === "object" &&
				"redirect" in redirectError
			) {
				throw redirectError;
			}

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
	const loading = useAuthLoading();
	const isAuthenticated = useIsAuthenticated();
	const initialized = useAuthStore((state) => state.initialized);
	const navigate = useNavigate();

	useEffect(() => {
		if (initialized && !loading && !isAuthenticated) {
			navigate({ to: "/login" });
		}
	}, [isAuthenticated, loading, initialized, navigate]);

	if (!initialized || loading || !isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<p className="text-muted-foreground text-sm">
						Loading your workspace...
					</p>
				</div>
			</div>
		);
	}

	return (
		<AppLayout>
			<Outlet />
		</AppLayout>
	);
}
