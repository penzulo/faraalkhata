import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/components/customers/CustomersPage";

export const Route = createFileRoute("/_authenticated/customers")({
	component: CustomersPage,
});
