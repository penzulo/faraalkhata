import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "@/routeTree.gen";
import { useAuthStore } from "@/stores/auth";
import "@/styles.css";

interface QueryError extends Error {
	status?: number;
	statusCode?: number;
	response?: {
		status?: number;
	};
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: (failureCount: number, error: Error): boolean => {
				const queryError = error as QueryError;

				if (
					queryError.status === 401 ||
					queryError.statusCode === 401 ||
					queryError.response?.status === 401 ||
					queryError.status === 403 ||
					queryError.statusCode === 403 ||
					queryError.response?.status === 403
				) {
					return false;
				}

				if (
					queryError.status === 404 ||
					queryError.statusCode === 404 ||
					queryError.response?.status === 404
				) {
					return false;
				}

				return failureCount < 3;
			},
		},
	},
});

const router = createRouter({
	routeTree,
	context: {
		queryClient,
	},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const initializeAndRenderApp = async () => {
	console.log("[main] Initializing authentication");

	try {
		await useAuthStore.getState().init();
		console.log("[main] Authentication initialized successfully.");
	} catch (e) {
		console.error("[main] Failed to initialize authentication:", e);
	}

	const rootElement = document.getElementById("app");
	if (rootElement && !rootElement.innerHTML) {
		const root = ReactDOM.createRoot(rootElement);
		root.render(
			<StrictMode>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</StrictMode>,
		);
		console.log("[main] Application rendered successfully.");
	}
};

initializeAndRenderApp();
