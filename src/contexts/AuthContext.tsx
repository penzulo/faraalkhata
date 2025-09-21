import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { supabase } from "../lib/supabase";
import type { AuthContextType, AuthState, PublicUser } from "../types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [state, setState] = useState<AuthState>({
		user: null,
		publicUser: null,
		session: null,
		loading: true,
		error: null,
	});

	// Use ref to track if we're currently processing an auth change
	const processingAuthChange = useRef(false);

	const clearError = useCallback(() => {
		setState((prev) => ({ ...prev, error: null }));
	}, []);

	const fetchPublicUser = useCallback(
		async (userId: string): Promise<PublicUser | null> => {
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
		},
		[],
	);

	const handleAuthChange = useCallback(
		async (event: AuthChangeEvent, session: Session | null) => {
			// Prevent multiple simultaneous auth change processes
			if (processingAuthChange.current) {
				return;
			}

			processingAuthChange.current = true;

			// Only show loading for initial session and sign-in events
			const shouldShowLoading =
				event === "INITIAL_SESSION" || event === "SIGNED_IN";

			if (shouldShowLoading) {
				setState((prev) => ({ ...prev, loading: true, error: null }));
			}

			try {
				if (session?.user) {
					const publicUser = await fetchPublicUser(session.user.id);
					setState({
						user: session.user,
						publicUser,
						session,
						loading: false,
						error: null,
					});
				} else {
					setState({
						user: null,
						publicUser: null,
						session: null,
						loading: false,
						error: null,
					});
				}
			} catch (error) {
				console.error("Error in handleAuthChange:", error);
				setState((prev) => ({
					...prev,
					loading: false,
					error:
						error instanceof Error ? error.message : "Authentication error",
				}));
			} finally {
				processingAuthChange.current = false;
			}
		},
		[fetchPublicUser],
	);

	const signInWithMagicLink = useCallback(
		async (email: string, redirectUrl?: string) => {
			try {
				setState((prev) => ({ ...prev, loading: true, error: null }));

				const { error } = await supabase.auth.signInWithOtp({
					email,
					options: {
						emailRedirectTo:
							redirectUrl || `${window.location.origin}/auth/callback`,
					},
				});

				if (error) {
					setState((prev) => ({
						...prev,
						error: error.message,
						loading: false,
					}));
					throw error;
				}

				setState((prev) => ({ ...prev, loading: false }));
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "An error occurred during sign in";
				setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
				throw error;
			}
		},
		[],
	);

	const signOut = useCallback(async () => {
		try {
			setState((prev) => ({ ...prev, loading: true, error: null }));

			const { error } = await supabase.auth.signOut();

			if (error) {
				setState((prev) => ({ ...prev, error: error.message, loading: false }));
				throw error;
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "An error occurred during sign out";
			setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
			throw error;
		}
	}, []);

	useEffect(() => {
		let mounted = true;

		// Get initial session
		const getInitialSession = async () => {
			try {
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();

				if (!mounted) return;

				if (error) {
					console.error("Error getting initial session:", error);
					setState((prev) => ({
						...prev,
						error: error.message,
						loading: false,
					}));
					return;
				}

				await handleAuthChange("INITIAL_SESSION", session);
			} catch (error) {
				if (!mounted) return;
				console.error("Error in getInitialSession:", error);
				setState((prev) => ({
					...prev,
					error:
						error instanceof Error
							? error.message
							: "Failed to initialize session",
					loading: false,
				}));
			}
		};

		getInitialSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (!mounted) return;

			// Filter out redundant events that don't require full processing
			if (
				event === "TOKEN_REFRESHED" &&
				state.user &&
				session?.user?.id === state.user.id
			) {
				// Just update the session without showing loading or refetching user data
				setState((prev) => ({ ...prev, session }));
				return;
			}

			handleAuthChange(event, session);
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, [handleAuthChange]); // Remove state.user dependency to prevent unnecessary re-subscriptions

	const value: AuthContextType = {
		...state,
		signInWithMagicLink,
		signOut,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
