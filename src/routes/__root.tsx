import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanstackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { FormDevtoolsPlugin } from "@tanstack/react-form-devtools";

import type { QueryClient } from "@tanstack/react-query";
import type { AuthContextType } from "@/types/auth";
import type React from "react";
import { AuthProvider } from "@/contexts/AuthContext";

interface MyRouterContext {
	queryClient: QueryClient;
	auth?: AuthContextType;
}

const RootComponent: React.FC = () => {
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
					// @ts-ignore 2322
					FormDevtoolsPlugin(),
				]}
			/>
		</AuthProvider>
	);
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
});
