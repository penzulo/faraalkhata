import type React from "react";

export type Compute<T> = {
	[K in keyof T]: T[K];
} & {};

export type NavItem = {
	name: string;
	href: string;
	icon: React.ElementType;
	description: string;
	isAction: boolean;
};

export interface NavContentProps {
	onLinkClick?: () => void;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
	navigationItems: NavItem[];
}
