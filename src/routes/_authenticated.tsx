import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
	const { loading, user, session } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && (!user || !session)) {
			navigate({ to: "/login" });
		}
	}, [user, session, loading, navigate]);

	// Only show loading if we don't have a user and we're actually loading
	if (loading || !user || !session) {
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
