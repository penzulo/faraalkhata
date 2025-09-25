export interface Category {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
}

export interface Customer {
	id: string;
	name: string;
	phone: string;
	notes: string | null;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export interface CustomerCategory {
	id: string;
	customer_id: string;
	category_id: string;
	created_at: string;
}

export interface CustomerWithCategories extends Customer {
	categories: Category[];
	customer_categories?: undefined; // Junction table data
}

export interface CustomerFormData {
	name: string;
	phone: string;
	notes?: string;
	category_ids: string[];
}

export interface CustomerSearchParams {
	query?: string;
	category_id?: string[];
	show_archived?: boolean;
	sort_by?: "name" | "created_at" | "updated_at";
	sort_order: "asc" | "desc";
}

export interface CutomerFilters {
	search: string;
	selectedCategories: string[];
	showArchived: boolean;
}

export interface ArchiveCustomerData {
	id: string;
	is_archived: boolean;
}

export interface CustomerCardProps {
	customer: CustomerWithCategories;
	onEdit: (customer: CustomerWithCategories) => void;
	onView: (customer: CustomerWithCategories) => void;
	onArchive: (customer: CustomerWithCategories) => void;
}

export interface CustomerFormProps {
	isOpen: boolean;
	onClose: () => void;
	editCustomer?: CustomerWithCategories | null;
}

export interface CustomerSearchResult {
	item: CustomerWithCategories;
	score: number;
	matches: Array<{ indices: [number, number][]; value: string; key: string }>;
}

export interface CustomerFormData {
	name: string;
}

export interface CategoryOption {
	value: string;
	label: string;
	isNew?: boolean;
}

export interface CustomerStats {
	total: number;
	active: number;
	archived: number;
	by_category: Record<string, number>;
	recent_additions: number;
}

export interface CustomerApiResponse {
	customers: CustomerWithCategories[];
	total: number;
	has_more?: boolean;
}

export interface CategoriesApiResponse {
	categories: Category[];
	total: number;
}

export interface CustomerError {
	code: string;
	message: string;
	field?: keyof CustomerFormData;
}

export interface CustomerValidationSchema {
	name: string;
	phone: string;
	notes?: string;
	category_ids: string[];
}

export interface ArchiveDialogData {
	customer: CustomerWithCategories;
	action: "archive" | "unarchive";
}

export interface CustomerInitials {
	initials: string;
	backgroundColor: string;
	textColor: string;
}

// Future order integration types (for when you implement orders)
export interface CustomerOrderSummary {
	customer_id: string;
	total_orders: number;
	total_amount: number;
	last_order_date: string | null;
	average_order_value: number;
}

export interface CustomerWithOrderStats extends CustomerWithCategories {
	order_summary?: CustomerOrderSummary;
}

// Predefined category constants
export const PREDEFINED_CATEGORIES = [
	"Family",
	"Friend",
	"Regular Customer",
	"Wholesale",
	"Retail",
] as const;

export type PredefinedCategory = (typeof PREDEFINED_CATEGORIES)[number];

// Phone number formatting utility type
export interface FormattedPhone {
	raw: string; // "9876543210"
	formatted: string; // "+91 98765 43210"
	display: string; // "98765 43210"
}

// Mobile responsiveness types
export interface CustomerDisplayMode {
	view: "cards" | "table";
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
}

// Sorting and filtering options
export const SORT_OPTIONS = [
	{ value: "name", label: "Name (A-Z)" },
	{ value: "created_at", label: "Recently Added" },
	{ value: "updated_at", label: "Recently Updated" },
] as const;

export type CustomerSortOption = (typeof SORT_OPTIONS)[number]["value"];
