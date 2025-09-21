import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { user, publicUser, signOut } = useAuth();

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold">Dashboard</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-gray-700">
								Welcome, {publicUser?.full_name || user?.email}!
							</span>
							<button
								onClick={signOut}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
							>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</nav>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">
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
