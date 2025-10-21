import type { LucideIcon } from "lucide-react";

export type Compute<T> = {
	[K in keyof T]: T[K];
} & {};

export type NavItem =
	| {
			name: string;
			href: string;
			icon: LucideIcon;
			description: string;
			type: "link";
	  }
	| {
			name: string;
			icon: LucideIcon;
			description: string;
			type: "action";
			actionId: string;
	  };

export interface NavContentProps {
	collapsed?: boolean;
	onToggleCollapse?: () => void;
	onLinkClick?: () => void;
	navigationItems: readonly NavItem[];
	onAction?: (actionId: string) => void;
}
