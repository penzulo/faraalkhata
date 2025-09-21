import { TanstackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPlugin } from "@tanstack/react-form-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ErrorComponent } from "@/components/shared/ErrorComponent";
import { NotFound } from "@/components/shared/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import type { AuthContextType } from "@/types/auth";

interface MyRouterContext {
	queryClient: QueryClient;
	auth?: AuthContextType;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	notFoundComponent: NotFound,
	errorComponent: ErrorComponent,
});

function RootComponent() {
	return (
		<AuthProvider>
			<Outlet />
			<TanstackDevtools
				config={{
					position: "bottom-left",
					hideUntilHover: true,
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					{
						name: "Tanstack Query",
						render: <ReactQueryDevtoolsPanel />,
					},
					// @ts-expect-error 2322
					FormDevtoolsPlugin(),
				]}
			/>
		</AuthProvider>
	);
}
