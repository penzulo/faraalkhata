import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore, usePublicUser, useUser } from "@/stores/auth";
import type { NavContentProps } from "@/types/shared";

const MobileNavItem = memo<{
	item: NavContentProps["navigationItems"][number];
	isCurrent: boolean;
	onClick: () => void;
}>(({ item, isCurrent, onClick }) => {
	const Icon = item.icon;

	const className = cn(
		"group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200",
		isCurrent
			? "bg-primary text-primary-foreground shadow-sm"
			: item.type === "action"
				? "bg-accent text-accent-foreground hover:bg-accent/80"
				: "text-muted-foreground hover:bg-muted hover:text-foreground",
	);

	const content = (
		<>
			<Icon
				className={cn(
					"shrink-0 transition-transform group-hover:scale-110",
					item.type === "action" ? "h-4 w-4" : "h-5 w-5",
				)}
			/>
			<div className="flex-1">
				<div className="font-medium text-sm">{item.name}</div>
				<div
					className={cn(
						"text-xs opacity-75",
						isCurrent ? "text-primary-foreground/75" : "text-muted-foreground",
					)}
				>
					{item.description}
				</div>
			</div>
		</>
	);

	return item.type === "link" ? (
		<Link to={item.href} className={className} onClick={onClick}>
			{content}
		</Link>
	) : (
		<button type="button" onClick={onClick} className={className}>
			{content}
		</button>
	);
});

MobileNavItem.displayName = "MobileNavItem";

export function MobileNavContent({
	onLinkClick,
	navigationItems,
	onAction,
}: NavContentProps) {
	const user = useUser();
	const publicUser = usePublicUser();
	const signOut = useAuthStore((state) => state.signOut);
	const navigate = useNavigate();
	const location = useLocation();
	const { theme, setTheme } = useTheme();

	const handleSignOut = useCallback(async () => {
		try {
			await signOut();
			toast.success("Signed out successfully");
			navigate({ to: "/login" });
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Error signing out");
			navigate({ to: "/login" });
		}
	}, [signOut, navigate]);

	const toggleTheme = useCallback(() => {
		setTheme(theme === "dark" ? "light" : "dark");
	}, [theme, setTheme]);

	const isCurrentPath = useCallback(
		(href: string) => location.pathname === href,
		[location.pathname],
	);

	const handleItemClick = useCallback(
		(item: NavContentProps["navigationItems"][number]) => {
			if (item.type === "action" && onAction) {
				onAction(item.actionId);
			}
			onLinkClick?.();
		},
		[onAction, onLinkClick],
	);

	const userInitial = useMemo(
		() => publicUser?.full_name?.[0] || user?.email?.[0] || "U",
		[publicUser?.full_name, user?.email],
	);

	return (
		<div className="flex h-full flex-col">
			{/* Mobile Logo & Brand */}
			<div className="border-b p-6">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-faraal-saffron to-faraal-gold shadow-sm">
						<Sparkles className="h-5 w-5 text-white" />
					</div>
					<div>
						<h1 className="font-semibold text-foreground text-lg">
							FaraalKhata
						</h1>
						<p className="text-muted-foreground text-xs">Festive Commerce</p>
					</div>
				</div>
			</div>

			{/* Mobile Navigation */}
			<nav className="flex-1 space-y-2 p-4">
				{navigationItems.map((item) => {
					const isCurrent =
						item.type === "link" ? isCurrentPath(item.href) : false;
					const key = item.type === "link" ? item.href : item.actionId;

					return (
						<MobileNavItem
							key={key}
							item={item}
							isCurrent={isCurrent}
							onClick={() => handleItemClick(item)}
						/>
					);
				})}
			</nav>

			{/* Mobile User Info & Actions */}
			<div className="border-t p-4">
				<div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
						<span className="font-medium text-primary-foreground text-sm">
							{userInitial}
						</span>
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-foreground text-sm">
							{publicUser?.full_name || "User"}
						</p>
						<p className="truncate text-muted-foreground text-xs">
							{user?.email}
						</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="mb-2 w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground"
					onClick={toggleTheme}
				>
					{theme === "dark" ? (
						<>
							<Sun className="mr-2 h-4 w-4" />
							Light Mode
						</>
					) : (
						<>
							<Moon className="mr-2 h-4 w-4" />
							Dark Mode
						</>
					)}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
					onClick={handleSignOut}
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign Out
				</Button>
			</div>
		</div>
	);
}
