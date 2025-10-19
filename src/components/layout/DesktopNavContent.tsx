import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronUp, LogOut, Moon, Pin, PinOff, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore, usePublicUser, useUser } from "@/stores/auth";
import type { NavContentProps } from "@/types/shared";

export function DesktopNavContent({
	collapsed = false,
	onToggleCollapse,
	navigationItems,
}: NavContentProps) {
	const user = useUser();
	const publicUser = usePublicUser();
	const navigate = useNavigate();
	const location = useLocation();
	const { theme, setTheme } = useTheme();

	const handleSignOut = async () => {
		try {
			await useAuthStore.getState().signOut();
			toast.success("Signed out successfully.");
			navigate({ to: "/login" });
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Error signing out");
			navigate({ to: "/login" });
		}
	};

	const isCurrentPath = (path: string) => location.pathname === path;

	return (
		<div className="flex h-full flex-col">
			{/* Logo & Brand with Toggle */}
			<div
				className={cn(
					"flex items-center border-border border-b transition-all duration-300",
					collapsed ? "flex-col gap-2 p-3" : "justify-between p-6",
				)}
			>
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-faraal-saffron to-faraal-gold">
						<span className="font-bold text-sm text-white">F</span>
					</div>
					{!collapsed && (
						<div className="min-w-0">
							<h1 className="whitespace-nowrap font-semibold text-foreground text-lg">
								FaraalKhata
							</h1>
							<p className="whitespace-nowrap text-muted-foreground text-xs">
								Festive Commerce
							</p>
						</div>
					)}
				</div>

				{onToggleCollapse && (
					<Tooltip delayDuration={300}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								onClick={onToggleCollapse}
								className="h-8 w-8 shrink-0 p-0 hover:bg-muted"
							>
								{collapsed ? (
									<Pin className="h-4 w-4" />
								) : (
									<PinOff className="h-4 w-4" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{collapsed ? "Pin sidebar open" : "Unpin sidebar"}
						</TooltipContent>
					</Tooltip>
				)}
			</div>

			{/* Navigation */}
			<nav
				className={cn(
					"flex-1 space-y-1 transition-all duration-300",
					collapsed ? "p-2" : "p-4",
				)}
			>
				{navigationItems.map((item) => {
					const Icon = item.icon;
					const isCurrent = isCurrentPath(item.href);

					const navItem = (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								"group relative flex w-full items-center gap-3 rounded-lg transition-all duration-200",
								collapsed ? "justify-center p-3" : "px-3 py-2.5",
								isCurrent
									? "bg-primary text-primary-foreground shadow-sm"
									: item.isAction
										? "bg-accent text-accent-foreground hover:bg-accent/80"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<Icon
								className={cn(
									"shrink-0 transition-transform group-hover:scale-110",
									item.isAction ? "h-4 w-4" : "h-5 w-5",
								)}
							/>
							{!collapsed && (
								<div className="min-w-0 flex-1">
									<div className="whitespace-nowrap font-medium text-sm">
										{item.name}
									</div>
									<div
										className={cn(
											"whitespace-nowrap text-xs opacity-75",
											isCurrent
												? "text-primary-foreground/75"
												: "text-muted-foreground",
										)}
									>
										{item.description}
									</div>
								</div>
							)}
						</Link>
					);

					if (collapsed) {
						return (
							<Tooltip key={item.href} delayDuration={300}>
								<TooltipTrigger asChild>{navItem}</TooltipTrigger>
								<TooltipContent side="right" className="ml-2">
									<div>
										<div className="font-medium">{item.name}</div>
										<div className="text-xs opacity-75">{item.description}</div>
									</div>
								</TooltipContent>
							</Tooltip>
						);
					}

					return navItem;
				})}
			</nav>

			{/* User Profile Section */}
			<div
				className={cn(
					"border-border border-t transition-all duration-300",
					collapsed ? "p-2" : "p-4",
				)}
			>
				{collapsed ? (
					<Tooltip delayDuration={300}>
						<TooltipTrigger asChild>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="h-auto w-full justify-center p-3 hover:bg-muted"
									>
										<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
											<span className="font-medium text-[10px] text-primary-foreground">
												{publicUser?.full_name?.[0] || user?.email?.[0] || "U"}
											</span>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									side="right"
									className="ml-2 w-56"
								>
									<DropdownMenuLabel>
										<div className="flex flex-col space-y-1">
											<p className="font-medium text-sm">
												{publicUser?.full_name || "User"}
											</p>
											<p className="text-muted-foreground text-xs">
												{user?.email}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() =>
											setTheme(theme === "dark" ? "light" : "dark")
										}
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
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleSignOut}
										className="text-destructive focus:bg-destructive/10 focus:text-destructive"
									>
										<LogOut className="mr-2 h-4 w-4" />
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</TooltipTrigger>
						<TooltipContent side="right" className="ml-2">
							<div>
								<div className="font-medium">
									{publicUser?.full_name || "User"}
								</div>
								<div className="text-xs opacity-75">Profile Menu</div>
							</div>
						</TooltipContent>
					</Tooltip>
				) : (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="group h-auto w-full justify-between p-3 hover:bg-muted"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
										<span className="font-medium text-primary-foreground text-xs">
											{publicUser?.full_name?.[0] || user?.email?.[0] || "U"}
										</span>
									</div>
									<div className="min-w-0 flex-1 text-left">
										<p className="truncate font-medium text-foreground text-sm">
											{publicUser?.full_name || "User"}
										</p>
										<p className="truncate text-muted-foreground text-xs">
											{user?.email}
										</p>
									</div>
								</div>
								<ChevronUp className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" side="top" className="mb-2 w-56">
							<DropdownMenuLabel>Account</DropdownMenuLabel>
							<DropdownMenuSeparator />

							<DropdownMenuItem
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={handleSignOut}
								className="text-destructive focus:bg-destructive/10 focus:text-destructive"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}
