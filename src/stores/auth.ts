import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Prettify } from "@/lib/utils";
import type { MagicLinkOptions, PublicUser } from "@/types/auth";

interface AuthState {
	user: User | null;
	publicUser: PublicUser | null;
	session: Session | null;
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

interface AuthActions {
	signInWithLoginLink: (
		email: string,
		redirectUrl?: string,
		options?: MagicLinkOptions,
	) => Promise<void>;
	signOut: () => Promise<void>;
	clearError: () => void;
	init: () => Promise<void>;
	setSession: (session: Session | null) => Promise<void>;
}

type AuthStore = Prettify<AuthState & AuthActions>;

export const useAuthStore = create<AuthStore>((set, get) => ({
	user: null,
	publicUser: null,
	session: null,
	loading: true,
	error: null,
	initialized: false,

	clearError: () => set({ error: null }),

	setSession: async (session: Session | null) => {
		if (session?.user) {
			const publicUser = await fetchPublicUser(session.user.id);
			set({
				user: session.user,
				publicUser,
				session,
				loading: false,
				error: null,
			});
		} else {
			set({
				user: null,
				publicUser: null,
				session: null,
				loading: false,
				error: null,
			});
		}
	},

	signInWithLoginLink: async (
		email: string,
		redirectUrl?: string,
		options?: MagicLinkOptions,
	) => {
		try {
			set({ loading: true, error: null });

			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo:
						redirectUrl || `${window.location.origin}/auth/callback`,
					data: options?.data || {},
				},
			});

			if (error) {
				set({ error: error.message, loading: false });
				throw error;
			}

			set({ loading: false });
		} catch (e) {
			const errorMessage =
				e instanceof Error ? e.message : "An error occured during sign in";
			set({ error: errorMessage, loading: false });
			throw e;
		}
	},

	signOut: async () => {
		try {
			set({ loading: true, error: null });

			const { error } = await supabase.auth.signOut();

			if (error) {
				set({ error: error.message, loading: false });
				throw error;
			}

			set({ user: null, publicUser: null, session: null, loading: false });
		} catch (e) {
			const errorMessage =
				e instanceof Error ? e.message : "An error occurred during sign out.";
			set({ error: errorMessage, loading: false });
			throw e;
		}
	},
	init: async () => {
		if (get().initialized) return;

		try {
			set({ loading: true, error: null });

			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();

			if (error) {
				console.error("Error getting initial session:", error);
				set({ error: error.message, loading: false, initialized: true });
				return;
			}

			await get().setSession(session);
			set({ initialized: true });

			supabase.auth.onAuthStateChange(
				async (event: AuthChangeEvent, session: Session | null) => {
					console.log("Auth state changed:", event);

					if (
						event === "TOKEN_REFRESHED" &&
						get().user &&
						session?.user?.id === get().user?.id
					) {
						set({ session });
						return;
					}

					await get().setSession(session);
				},
			);
		} catch (e) {
			console.error("Error in init:", e);
			set({
				error: e instanceof Error ? e.message : "Failed to initialize session",
				loading: false,
				initialized: true,
			});
		}
	},
}));

async function fetchPublicUser(userId: string): Promise<PublicUser | null> {
	try {
		const { data, error } = await supabase
			.from("User")
			.select("id, full_name")
			.eq("id", userId)
			.single();

		if (error) {
			console.error("Error fetching public user:", error);
			return null;
		}

		return data;
	} catch (error) {
		console.error("Error in fetchPublicUser:", error);
		return null;
	}
}

export const useUser = () => useAuthStore((state) => state.user);
export const usePublicUser = () => useAuthStore((state) => state.publicUser);
export const useSession = () => useAuthStore((state) => state.session);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () =>
	useAuthStore((state) => !!state.user && !!state.session);
