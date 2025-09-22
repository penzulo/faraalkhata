import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface PublicUser {
	id: string;
	full_name: string | null;
}

export interface AuthState {
	user: SupabaseUser | null;
	publicUser: PublicUser | null;
	session: Session | null;
	loading: boolean;
	error: string | null;
}

export interface MagicLinkOptions {
	// biome-ignore lint/suspicious/noExplicitAny: Supabase Metadata Type
	data?: Record<string, any>;
}

export interface AuthContextType extends AuthState {
	signInWithMagicLink: (
		email: string,
		redirectUrl?: string,
		options?: MagicLinkOptions,
	) => Promise<void>;
	signOut: () => Promise<void>;
	clearError: () => void;
}
