import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

interface QueryError extends Error {
	status?: number;
	statusCode?: number;
	response?: {
		status?: number;
	};
}

// Create a new router instance
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

				// Don't retry on 404 (not found) errors
				if (
					queryError.status === 404 ||
					queryError.statusCode === 404 ||
					queryError.response?.status === 404
				) {
					return false;
				}

				// Retry up to 3 times for other errors
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

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
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
}
