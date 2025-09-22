import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home, Package, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFound() {
	const router = useRouter();

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

			{/* 404 Content */}
			<div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
				<div className="mx-auto max-w-2xl space-y-8 text-center">
					{/* Large 404 Display */}
					<div className="space-y-4">
						<div className="relative inline-block">
							<h1 className="bg-gradient-to-br from-faraal-saffron to-faraal-gold bg-clip-text font-bold text-8xl text-transparent md:text-9xl">
								404
							</h1>
							<div className="-top-4 -right-4 absolute h-8 w-8 animate-bounce rounded-full bg-faraal-gold/20" />
							<div className="-bottom-4 -left-4 absolute h-6 w-6 animate-bounce rounded-full bg-faraal-saffron/20 delay-300" />
						</div>

						<div className="space-y-2">
							<h2 className="font-semibold text-2xl text-foreground md:text-3xl">
								This page has gone on a festive break!
							</h2>
							<p className="mx-auto max-w-md text-lg text-muted-foreground">
								The page you're looking for might have been moved, deleted, or
								is temporarily unavailable.
							</p>
						</div>
					</div>

					{/* Navigation Options */}
					<div className="mx-auto grid max-w-md gap-4 sm:grid-cols-3">
						<Button asChild variant="default" className="h-12">
							<Link to="/dashboard">
								<Home className="mb-1 h-5 w-5" />
								<span className="text-sm">Dashboard</span>
							</Link>
						</Button>

						<Button asChild variant="outline" className="h-12">
							<Link to="/products">
								<Package className="mb-1 h-5 w-5" />
								<span className="text-sm">Products</span>
							</Link>
						</Button>

						<Button asChild variant="outline" className="h-12">
							<Link to="/orders">
								<Search className="mb-1 h-5 w-5" />
								<span className="text-sm">Orders</span>
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
