import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import type { AuthContextType, AuthState, PublicUser } from "@/types/auth";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined)
		throw new Error("useAuth must be used within an AuthProvider");
	return context;
};

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [auth, setAuth] = useState<AuthState>({
		user: null,
		publicUser: null,
		session: null,
		loading: true,
		error: null,
	});

	const clearError = useCallback(() => {
		setAuth((prev) => ({ ...prev, error: null }));
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
		async (_event: AuthChangeEvent, session: Session | null) => {
			setAuth((prev) => ({ ...prev, loading: true, error: null }));

			if (session?.user) {
				const publicUser = await fetchPublicUser(session.user.id);
				setAuth({
					user: session.user,
					publicUser,
					session,
					loading: false,
					error: null,
				});
			} else {
				setAuth({
					user: null,
					publicUser: null,
					session: null,
					loading: false,
					error: null,
				});
			}
		},
		[fetchPublicUser],
	);

	const signInWithMagicLink = useCallback(
		async (email: string, redirectUrl?: string) => {
			try {
				setAuth((prev) => ({ ...prev, loading: true, error: null }));

				const { error } = await supabase.auth.signInWithOtp({
					email,
					options: {
						emailRedirectTo:
							redirectUrl || `${window.location.origin}/auth/callback`,
					},
				});

				if (error) {
					setAuth((prev) => ({
						...prev,
						error: error.message,
						loading: false,
					}));
					throw error;
				}

				setAuth((prev) => ({ ...prev, loading: false }));
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "An error occurred during sign in";
				setAuth((prev) => ({ ...prev, error: errorMessage, loading: false }));
				throw error;
			}
		},
		[],
	);

	const signOut = useCallback(async () => {
		try {
			setAuth((prev) => ({ ...prev, loading: true, error: null }));

			const { error } = await supabase.auth.signOut();

			if (error) {
				setAuth((prev) => ({ ...prev, error: error.message, loading: false }));
				throw error;
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "An error occurred during sign out";
			setAuth((prev) => ({ ...prev, error: errorMessage, loading: false }));
			throw error;
		}
	}, []);

	useEffect(() => {
		// Get initial session
		const getInitialSession = async () => {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();

			if (error) {
				console.error("Error getting initial session:", error);
				setAuth((prev) => ({ ...prev, error: error.message, loading: false }));
				return;
			}

			await handleAuthChange("INITIAL_SESSION", session);
		};

		getInitialSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(handleAuthChange);

		return () => {
			subscription.unsubscribe();
		};
	}, [handleAuthChange]);

	const value: AuthContextType = {
		...auth,
		signInWithMagicLink,
		signOut,
		clearError,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
