import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { user, publicUser, signOut, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && !user) navigate({ to: "/login" });
	}, [user, loading, navigate]);

	const handleSignOut = async () => {
		try {
			await signOut();
			navigate({ to: "/login" });
		} catch (error) {
			console.error("Sign out error:", error);
			navigate({ to: "/login" });
		}
	};

	if (loading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 justify-between">
						<div className="flex items-center">
							<h1 className="font-semibold text-xl">Dashboard</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-gray-700">
								Welcome, {publicUser?.full_name || user?.email}!
							</span>
							<button
								onClick={handleSignOut}
								className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
							>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</nav>

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
