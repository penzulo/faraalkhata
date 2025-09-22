import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && !user) navigate({ to: "/login" });
	}, [user, loading, navigate]);

	if (loading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="flex h-96 items-center justify-center rounded-lg border-4 border-gray-200 border-dashed">
						<div className="text-center">
							<h2 className="mb-4 font-bold text-2xl text-gray-900">
								Welcome to your Dashboard!
							</h2>
							<p className="text-gray-600">
								You are successfully authenticated with Supabase Magic Links.
							</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
