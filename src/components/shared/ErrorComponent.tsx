import {
	type ErrorComponentProps,
	Link,
	useRouter,
} from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowLeft,
	Bug,
	Home,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter();

	// Log error to monitoring service (Sentry, LogRocket, etc.)
	console.error("Route Error:", error);

	const handleRefresh = () => {
		window.location.reload();
	};

	const handleGoHome = () => {
		// Reset router error state and navigate
		router.navigate({ to: "/dashboard" });
	};

	const handleReportError = () => {
		// You can integrate with your error reporting service here
		toast.success("Error reported! Thank you for helping us improve.");
	};

	// Determine error type for better messaging
	const getErrorInfo = () => {
		if (error.message.includes("fetch") || error.message.includes("network")) {
			return {
				title: "Connection Problem",
				description:
					"Unable to connect to our servers. Please check your internet connection and try again.",
				suggestion: "This might be a temporary network issue.",
			};
		}

		if (error.message.includes("404") || error.message.includes("Not Found")) {
			return {
				title: "Page Not Available",
				description:
					"The page you were trying to access is currently unavailable.",
				suggestion:
					"The content might have been moved or temporarily disabled.",
			};
		}

		if (
			error.message.includes("auth") ||
			error.message.includes("unauthorized")
		) {
			return {
				title: "Authentication Error",
				description:
					"There was a problem with your session. Please sign in again.",
				suggestion: "Your session might have expired.",
			};
		}

		return {
			title: "Unexpected Error",
			description: "Something unexpected happened while loading this page.",
			suggestion: "This appears to be a technical issue on our end.",
		};
	};

	const errorInfo = getErrorInfo();

	return (
		<div className="min-h-screen bg-background">
			{/* Header with FaraalKhata branding */}
			<div className="border-border border-b bg-card">
				<div className="mx-auto flex max-w-7xl items-center justify-between p-4">
					<Link to="/dashboard" className="flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-faraal-saffron to-faraal-gold">
							<Sparkles className="h-5 w-5 text-white" />
						</div>
						<div>
							<h1 className="font-semibold text-foreground text-lg">
								FaraalKhata
							</h1>
						</div>
					</Link>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.history.back()}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Go Back
					</Button>
				</div>
			</div>

			{/* Error Content */}
			<div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
				<Card className="w-full max-w-2xl">
					<CardHeader className="pb-4 text-center">
						<div className="mb-4 flex justify-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
								<AlertTriangle className="h-8 w-8 text-destructive" />
							</div>
						</div>
						<CardTitle className="text-2xl text-foreground">
							{errorInfo.title}
						</CardTitle>
						<p className="mt-2 text-muted-foreground">
							{errorInfo.description}
						</p>
						<p className="text-muted-foreground/80 text-sm">
							{errorInfo.suggestion}
						</p>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Error Details (Collapsible in production) */}
						<Alert variant="destructive">
							<Bug className="h-4 w-4" />
							<AlertDescription>
								<details className="mt-2">
									<summary className="mb-2 cursor-pointer font-medium text-sm">
										Technical Details (Click to expand)
									</summary>
									<pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-destructive/5 p-3 text-xs">
										{error.message}
										{error.stack && `\n\nStack trace:\n${error.stack}`}
									</pre>
								</details>
							</AlertDescription>
						</Alert>

						{/* Action Buttons */}
						<div className="flex flex-col gap-3 sm:flex-row">
							<Button onClick={handleRefresh} className="flex-1">
								<RefreshCw className="mr-2 h-4 w-4" />
								Refresh Page
							</Button>

							<Button
								variant="outline"
								onClick={handleGoHome}
								className="flex-1"
							>
								<Home className="mr-2 h-4 w-4" />
								Go to Dashboard
							</Button>
						</div>

						{/* Secondary Actions */}
						<div className="flex flex-col gap-2 pt-2 sm:flex-row">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleReportError}
								className="flex-1 text-muted-foreground"
							>
								<Bug className="mr-2 h-4 w-4" />
								Report This Error
							</Button>

							<Button
								variant="ghost"
								size="sm"
								asChild
								className="flex-1 text-muted-foreground"
							>
								<Link to="/products">Browse Products</Link>
							</Button>
						</div>

						{/* Help Text */}
						<div className="border-border border-t pt-4 text-center">
							<p className="text-muted-foreground text-xs">
								If this problem persists, please contact our support team.
								<br />
								We apologize for any inconvenience this may have caused.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
