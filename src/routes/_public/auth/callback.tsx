import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

type CallbackSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/_public/auth/callback")({
	component: AuthCallback,
	validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: async ({ search }) => {
		// Handle the auth callback
		const { error } = await supabase.auth.getSession();

		if (error) {
			console.error("Auth callback error:", error);
			throw redirect({ to: "/login" });
		}

		// Redirect to the intended destination or dashboard
		const redirectTo = (search as CallbackSearch).redirect || "/dashboard";
		throw redirect({ to: redirectTo });
	},
});

function AuthCallback() {
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
		</div>
	);
}
