import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { NavContentProps } from "@/types/shared";

export function MobileBottomNavigation({ navigationItems }: NavContentProps) {
	const location = useLocation();

	return (
		<div className="fixed right-0 bottom-0 left-0 z-50 border-border border-t bg-card">
			<nav className="flex items-center justify-around py-2">
				{navigationItems.map((item) => {
					const Icon = item.icon;
					const isCurrent = location.pathname === item.href;

					return (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								"flex flex-col items-center gap-1 rounded-lg p-2 transition-colors",
								isCurrent
									? "text-primary"
									: item.isAction
										? "text-accent-foreground"
										: "text-muted-foreground",
							)}
						>
							<Icon className={cn("h-5 w-5", item.isAction && "h-4 w-4")} />
							<span className="font-medium text-xs">{item.name}</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
