import { useMediaQuery } from "usehooks-ts";

interface AppLoadingProps {
	message?: string;
	size?: "sm" | "md" | "lg";
}

export function AppLoading({ message, size }: AppLoadingProps) {
	const isMobile = useMediaQuery("(max-width: 767px)");

	const spinnerSize = size
		? { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" }[size]
		: isMobile
			? "h-8 w-8"
			: "h-10 w-10";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-4">
				<div
					className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${spinnerSize}`}
				/>
				{message && <p className="text-muted-foreground text-sm">{message}</p>}
			</div>
		</div>
	);
}
