import {
	LayoutDashboard,
	Menu,
	Package,
	Plus,
	ShoppingCart,
	Users,
} from "lucide-react";
import type React from "react";
import { useBoolean, useLocalStorage, useMediaQuery } from "usehooks-ts";
import { DesktopNavContent } from "@/components/layout/DesktopNavContent";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";
import { MobileNavContent } from "@/components/layout/MobileNavContent";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
	children: React.ReactNode;
}

const navigationItems = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		description: "Overview & Analytics",
		isAction: false,
	},
	{
		name: "Orders",
		href: "/orders",
		icon: ShoppingCart,
		description: "Manage Orders",
		isAction: false,
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
		isAction: false,
	},
	{
		name: "Customers",
		href: "/customers",
		icon: Users,
		description: "Manage Customers",
		isAction: false,
	},
];

export function AppLayout({ children }: AppLayoutProps) {
	const {
		value: sidebarOpen,
		setValue: openSidebar,
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
									navigationItems={navigationItems}
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

								<Sheet open={sidebarOpen} onOpenChange={openSidebar}>
									<SheetTrigger asChild>
										<Button variant="ghost" size="sm">
											<Menu className="h-5 w-5" />
										</Button>
									</SheetTrigger>
									<SheetContent side="right" className="w-64 p-0">
										<MobileNavContent
											onLinkClick={closeSidebar}
											navigationItems={navigationItems}
										/>
									</SheetContent>
								</Sheet>
							</div>
						</div>

						{/* Mobile Main Content */}
						<main className="min-h-screen pb-16">{children}</main>

						{/* Mobile Bottom Navigation */}
						<MobileBottomNavigation navigationItems={navigationItems} />
					</>
				)}
			</div>
		</TooltipProvider>
	);
}
