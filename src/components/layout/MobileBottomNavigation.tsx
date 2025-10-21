import { Link, useLocation } from "@tanstack/react-router";
import { memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { NavContentProps } from "@/types/shared";

const BottomNavItem = memo<{
	item: NavContentProps["navigationItems"][number];
	isCurrent: boolean;
	onAction?: (actionId: string) => void;
}>(({ item, isCurrent, onAction }) => {
	const Icon = item.icon;

	const handleClick = useCallback(() => {
		if (item.type === "action" && onAction) {
			onAction(item.actionId);
		}
	}, [item, onAction]);

	const className = cn(
		"flex flex-col items-center gap-1 rounded-lg p-2 transition-colors active:scale-95",
		isCurrent
			? "text-primary"
			: item.type === "action"
				? "text-accent-foreground"
				: "text-muted-foreground hover:text-foreground",
	);

	const content = (
		<>
			<Icon className={cn("h-5 w-5", item.type === "action" && "h-4 w-4")} />
			<span className="font-medium text-xs">{item.name}</span>
		</>
	);

	return item.type === "link" ? (
		<Link to={item.href} className={className}>
			{content}
		</Link>
	) : (
		<button
			type="button"
			onClick={handleClick}
			className={className}
			aria-label={item.description}
		>
			{content}
		</button>
	);
});

BottomNavItem.displayName = "BottomNavItem";

export const MobileBottomNavigation = memo<NavContentProps>(
	({ navigationItems, onAction }) => {
		const location = useLocation();

		const isCurrentPath = useCallback(
			(href: string) => location.pathname === href,
			[location.pathname],
		);

		return (
			<nav
				className="fixed right-0 bottom-0 left-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90"
				aria-label="Mobile bottom navigation"
			>
				<div className="safe-area-inset-bottom flex items-center justify-around py-2">
					{navigationItems.map((item) => {
						const isCurrent =
							item.type === "link" ? isCurrentPath(item.href) : false;
						const key = item.type === "link" ? item.href : item.actionId;

						return (
							<BottomNavItem
								key={key}
								item={item}
								isCurrent={isCurrent}
								onAction={onAction}
							/>
						);
					})}
				</div>
			</nav>
		);
	},
);

MobileBottomNavigation.displayName = "MobileBottomNavigation";
