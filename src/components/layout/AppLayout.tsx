import {
	LayoutDashboard,
	Menu,
	Package,
	Plus,
	ShoppingCart,
	Users,
} from "lucide-react";
import type React from "react";
import { useCallback, useMemo } from "react";
import { useBoolean, useLocalStorage, useMediaQuery } from "usehooks-ts";
import { DesktopNavContent } from "@/components/layout/DesktopNavContent";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";
import { MobileNavContent } from "@/components/layout/MobileNavContent";
import { OrderForm } from "@/components/orders/OrderForm";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/shared";

interface AppLayoutProps {
	children: React.ReactNode;
}

const NAVIGATION_ITEMS: readonly NavItem[] = [
	{
		name: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		description: "Overview & Analytics",
		type: "link",
	},
	{
		name: "Orders",
		href: "/orders",
		icon: ShoppingCart,
		description: "Manage Orders",
		type: "link",
	},
	{
		name: "New Order",
		icon: Plus,
		description: "Create Order",
		type: "action",
		actionId: "create-order",
	},
	{
		name: "Products",
		href: "/products",
		icon: Package,
		description: "Product Catalog",
		type: "link",
	},
	{
		name: "Customers",
		href: "/customers",
		icon: Users,
		description: "Manage Customers",
		type: "link",
	},
] as const;

export function AppLayout({ children }: AppLayoutProps) {
	const {
		value: sidebarOpen,
		setValue: openSidebar,
		setFalse: closeSidebar,
	} = useBoolean();

	const {
		value: orderFormOpen,
		setTrue: openOrderForm,
		setFalse: closeOrderForm,
	} = useBoolean();

	const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
		"faraal-sidebar-collapsed",
		false,
	);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const isMobile = useMediaQuery("(max-width: 767px)");

	const toggleSidebar = useCallback(() => {
		setSidebarCollapsed((prev) => !prev);
	}, [setSidebarCollapsed]);

	const handleAction = useCallback(
		(actionId: string) => {
			switch (actionId) {
				case "create-order":
					openOrderForm();
					closeSidebar();
					break;
				default:
					console.warn("Unknown action:", actionId);
			}
		},
		[openOrderForm, closeSidebar],
	);

	const sidebarWidthClass = useMemo(
		() => (sidebarCollapsed ? "w-16" : "w-64"),
		[sidebarCollapsed],
	);

	const mainPaddingClass = useMemo(
		() => (sidebarCollapsed ? "pl-16" : "pl-64"),
		[sidebarCollapsed],
	);

	return (
		<TooltipProvider>
			<div className="min-h-screen bg-background">
				{/* Desktop Layout */}
				{isDesktop && (
					<>
						{/* Desktop Sidebar */}
						<aside
							className={cn(
								"fixed inset-y-0 left-0 z-30 transition-all duration-300",
								sidebarWidthClass,
							)}
						>
							<div className="flex h-full flex-col border-r bg-card">
								<DesktopNavContent
									collapsed={sidebarCollapsed}
									onToggleCollapse={toggleSidebar}
									navigationItems={NAVIGATION_ITEMS}
									onAction={handleAction}
								/>
							</div>
						</aside>

						{/* Desktop Main Content */}
						<div
							className={cn("transition-all duration-300", mainPaddingClass)}
						>
							<main className="min-h-screen">{children}</main>
						</div>
					</>
				)}

				{/* Mobile Layout */}
				{isMobile && (
					<>
						{/* Mobile Header */}
						<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
							<div className="flex items-center justify-between p-4">
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-faraal-saffron to-faraal-gold shadow-sm">
										<span className="font-bold text-sm text-white">F</span>
									</div>
									<h1 className="font-semibold text-foreground text-lg">
										FaraalKhata
									</h1>
								</div>

								<Sheet open={sidebarOpen} onOpenChange={openSidebar}>
									<SheetTrigger asChild>
										<Button variant="ghost" size="icon" aria-label="Open menu">
											<Menu className="h-5 w-5" />
										</Button>
									</SheetTrigger>
									<SheetContent side="right" className="w-64 p-0">
										<MobileNavContent
											onLinkClick={closeSidebar}
											navigationItems={NAVIGATION_ITEMS}
											onAction={handleAction}
										/>
									</SheetContent>
								</Sheet>
							</div>
						</header>

						{/* Mobile Main Content */}
						<main className="min-h-screen pb-20">{children}</main>

						{/* Mobile Bottom Navigation */}
						<MobileBottomNavigation
							navigationItems={NAVIGATION_ITEMS}
							onAction={handleAction}
						/>
					</>
				)}

				{/* Global Order Form Modal */}
				<OrderForm
					isOpen={orderFormOpen}
					onClose={closeOrderForm}
					editOrder={null}
				/>
			</div>
		</TooltipProvider>
	);
}
