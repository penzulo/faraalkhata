import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/orders/OrdersPage";

export const Route = createFileRoute("/_authenticated/orders")({
	component: OrdersPage,
});
