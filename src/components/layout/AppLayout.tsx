import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
	ChevronUp,
	LayoutDashboard,
	LogOut,
	Menu,
	Package,
	Pin,
	PinOff,
	Plus,
	Settings,
	ShoppingCart,
	Sparkles,
	User,
	Users,
} from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import { useBoolean, useLocalStorage, useMediaQuery } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
	children: React.ReactNode;
}

interface NavContentProps {
	onLinkClick?: () => void;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
}

const navigationItems = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		description: "Overview & Analytics",
	},
	{
		name: "Orders",
		href: "/orders",
		icon: ShoppingCart,
		description: "Manage Orders",
	},
	{
		name: "New Order",
		href: "/orders/new",
		icon: Plus,
		description: "Create Order",
		isAction: true,
	},
	{
		name: "Products",
		href: "/products",
		icon: Package,
		description: "Product Catalog",
	},
	{
		name: "Customers",
		href: "/customers",
		icon: Users,
		description: "Manage Customers",
	},
];

function DesktopNavContent({
	collapsed = false,
	onToggleCollapse,
}: NavContentProps) {
	const { user, publicUser, signOut } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const handleSignOut = async () => {
		try {
			await signOut();
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
									<DropdownMenuItem disabled>
										<Settings className="mr-2 h-4 w-4" />
										Settings (Coming Soon)
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
							<DropdownMenuItem disabled>
								<User className="mr-2 h-4 w-4" />
								Profile (Coming Soon)
							</DropdownMenuItem>
							<DropdownMenuItem disabled>
								<Settings className="mr-2 h-4 w-4" />
								Settings (Coming Soon)
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

function MobileNavContent({ onLinkClick }: NavContentProps) {
	const { user, publicUser, signOut } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const handleSignOut = async () => {
		try {
			await signOut();
			toast.success("Signed out successfully");
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
			{/* Mobile Logo & Brand */}
			<div className="border-border border-b p-6">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-faraal-saffron to-faraal-gold">
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
					const Icon = item.icon;
					const isCurrent = isCurrentPath(item.href);

					return (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								"group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200",
								isCurrent
									? "bg-primary text-primary-foreground shadow-sm"
									: item.isAction
										? "bg-accent text-accent-foreground hover:bg-accent/80"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
							onClick={onLinkClick}
						>
							<Icon
								className={cn(
									"shrink-0 transition-transform group-hover:scale-110",
									item.isAction ? "h-4 w-4" : "h-5 w-5",
								)}
							/>
							<div className="flex-1">
								<div className="font-medium text-sm">{item.name}</div>
								<div
									className={cn(
										"text-xs opacity-75",
										isCurrent
											? "text-primary-foreground/75"
											: "text-muted-foreground",
									)}
								>
									{item.description}
								</div>
							</div>
						</Link>
					);
				})}
			</nav>

			{/* Mobile User Info & Sign Out */}
			<div className="border-border border-t p-4">
				<div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
						<span className="font-medium text-primary-foreground text-sm">
							{publicUser?.full_name?.[0] || user?.email?.[0] || "U"}
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

function MobileBottomNavigation() {
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

export function AppLayout({ children }: AppLayoutProps) {
	const {
		value: sidebarOpen,
		setValue: setSidebarOpen,
		setFalse: closeSidebar,
	} = useBoolean();

	const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
		"faraal-sidebar-collapsed",
		false,
	);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const isMobile = useMediaQuery("(max-width: 767px)");

	const toggleSidebar = () => {
		setSidebarCollapsed(!sidebarCollapsed);
	};

	return (
		<TooltipProvider>
			<div className="min-h-screen bg-background">
				{/* Conditional Desktop Layout */}
				{isDesktop && (
					<>
						{/* Desktop Sidebar */}
						<div
							className={cn(
								"fixed inset-y-0 left-0 z-30 block transition-all duration-300",
								sidebarCollapsed ? "w-16" : "w-64",
							)}
						>
							<div className="flex h-full flex-col border-border border-r bg-card">
								<DesktopNavContent
									collapsed={sidebarCollapsed}
									onToggleCollapse={toggleSidebar}
								/>
							</div>
						</div>

						{/* Desktop Main Content */}
						<div
							className={cn(
								"transition-all duration-300",
								sidebarCollapsed ? "pl-16" : "pl-64",
							)}
						>
							<main className="min-h-screen">{children}</main>
						</div>
					</>
				)}

				{/* Conditional Mobile Layout */}
				{isMobile && (
					<>
						{/* Mobile Header */}
						<div className="sticky top-0 z-40 border-border border-b bg-background/95 backdrop-blur">
							<div className="flex items-center justify-between p-4">
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-faraal-saffron to-faraal-gold">
										<span className="font-bold text-sm text-white">F</span>
									</div>
									<h1 className="font-semibold text-lg">FaraalKhata</h1>
								</div>

								<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
									<SheetTrigger asChild>
										<Button variant="ghost" size="sm">
											<Menu className="h-5 w-5" />
										</Button>
									</SheetTrigger>
									<SheetContent side="right" className="w-64 p-0">
										<MobileNavContent onLinkClick={closeSidebar} />
									</SheetContent>
								</Sheet>
							</div>
						</div>

						{/* Mobile Main Content */}
						<main className="min-h-screen pb-16">{children}</main>

						{/* Mobile Bottom Navigation */}
						<MobileBottomNavigation />
					</>
				)}
			</div>
		</TooltipProvider>
	);
}
