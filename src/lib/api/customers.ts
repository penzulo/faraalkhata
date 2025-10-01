import { supabase } from "@/lib/supabase";
import type {
	ArchiveCustomerData,
	Category,
	CategoryFormData,
	Customer,
	CustomerFormData,
	CustomerSearchParams,
	CustomerWithCategories,
} from "@/types/customer";

export const customersApi = {
	/**
	 * Get all customers with their categories
	 * Similar to getProducts() but with category relationships
	 */
	async getCustomers(
		params?: CustomerSearchParams,
	): Promise<CustomerWithCategories[]> {
		let query = supabase.from("customers").select(`
        *,
        customer_categories!inner(
          category_id,
          categories!inner(
            id,
            name,
            created_at,
            updated_at
          )
        )
      `);

		// Apply filters
		if (params?.show_archived === false) {
			query = query.eq("is_archived", false);
		}

		// Apply sorting
		const sortBy = params?.sort_by || "name";
		const sortOrder = params?.sort_order || "asc";

		if (sortBy === "name") {
			query = query.order("name", { ascending: sortOrder === "asc" });
		} else {
			query = query.order(sortBy, { ascending: sortOrder === "asc" });
		}

		const { data, error } = await query;
		if (error) throw error;

		// Transform the data to flatten categories (similar to your product transformation)
		const customersWithCategories = data.map((customer) => {
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore // Supabase does not type tables.
			const categories =
				customer.customer_categories?.map((cc) => cc.categories) || [];

			return {
				...customer,
				categories,
				customer_categories: undefined, // Remove junction data
			};
		});

		return customersWithCategories;
	},

	/**
	 * Get a single customer by ID with categories
	 */
	async getCustomerById(id: string): Promise<CustomerWithCategories | null> {
		const { data, error } = await supabase
			.from("customers")
			.select(`
        *,
        customer_categories(
          category_id,
          categories(
            id,
            name,
            created_at,
            updated_at
          )
        )
      `)
			.eq("id", id)
			.single();

		if (error) {
			if (error.code === "PGRST116") return null; // Not found
			throw error;
		}

		// Transform categories
		// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
		// @ts-ignore // Supabase does not type tables.
		const categories =
			data.customer_categories?.map((cc) => cc.categories) || [];

		return {
			...data,
			categories,
			customer_categories: undefined,
		};
	},

	/**
	 * Create a new customer with categories
	 * Similar to createProduct but handles category relationships
	 */
	async createCustomer(data: CustomerFormData): Promise<Customer> {
		// First, create the customer
		const { data: customer, error: customerError } = await supabase
			.from("customers")
			.insert({
				name: data.name,
				phone: data.phone,
				notes: data.notes || null,
				is_archived: false,
			})
			.select()
			.single();

		if (customerError) throw customerError;

		// Then, create category relationships if any
		if (data.category_ids && data.category_ids.length > 0) {
			const categoryRelations = data.category_ids.map((categoryId) => ({
				customer_id: customer.id,
				category_id: categoryId,
			}));

			const { error: categoryError } = await supabase
				.from("customer_categories")
				.insert(categoryRelations);

			if (categoryError) {
				// Rollback customer creation if category assignment fails
				await supabase.from("customers").delete().eq("id", customer.id);
				throw categoryError;
			}
		}

		return customer;
	},

	/**
	 * Update customer details and categories
	 */
	async updateCustomer(id: string, data: CustomerFormData): Promise<Customer> {
		// First, update customer basic info
		const { data: updatedCustomer, error: updateError } = await supabase
			.from("customers")
			.update({
				name: data.name,
				phone: data.phone,
				notes: data.notes || null,
			})
			.eq("id", id)
			.select()
			.single();

		if (updateError) throw updateError;

		// Handle category updates
		if (data.category_ids !== undefined) {
			// Remove existing category relationships
			const { error: deleteError } = await supabase
				.from("customer_categories")
				.delete()
				.eq("customer_id", id);

			if (deleteError) throw deleteError;

			// Add new category relationships if any
			if (data.category_ids.length > 0) {
				const categoryRelations = data.category_ids.map((categoryId) => ({
					customer_id: id,
					category_id: categoryId,
				}));

				const { error: insertError } = await supabase
					.from("customer_categories")
					.insert(categoryRelations);

				if (insertError) throw insertError;
			}
		}

		return updatedCustomer;
	},

	/**
	 * Archive/Unarchive a customer (soft delete)
	 */
	async archiveCustomer(data: ArchiveCustomerData): Promise<Customer> {
		const { data: updatedCustomer, error } = await supabase
			.from("customers")
			.update({ is_archived: data.is_archived })
			.eq("id", data.id)
			.select()
			.single();

		if (error) throw error;
		return updatedCustomer;
	},

	/**
	 * Hard delete a customer (use with caution)
	 * This will cascade delete category relationships
	 */
	async deleteCustomer(id: string): Promise<void> {
		const { error } = await supabase.from("customers").delete().eq("id", id);

		if (error) throw error;
	},

	/**
	 * Search customers by name or phone (for fuzzy search preprocessing)
	 */
	async searchCustomers(
		query: string,
		includeArchived = false,
	): Promise<CustomerWithCategories[]> {
		let supabaseQuery = supabase
			.from("customers")
			.select(`
        *,
        customer_categories(
          category_id,
          categories(
            id,
            name,
            created_at,
            updated_at
          )
        )
      `)
			.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);

		if (!includeArchived) {
			supabaseQuery = supabaseQuery.eq("is_archived", false);
		}

		const { data, error } = await supabaseQuery.order("name");

		if (error) throw error;

		// Transform categories
		const customersWithCategories = data.map((customer) => {
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore // Supabase does not type tables.
			const categories =
				customer.customer_categories?.map((cc) => cc.categories) || [];

			return {
				...customer,
				categories,
				customer_categories: undefined,
			};
		});

		return customersWithCategories;
	},
};

/**
 * Categories API - Separate but related to customers
 */
export const categoriesApi = {
	/**
	 * Get all categories
	 */
	async getCategories(): Promise<Category[]> {
		const { data, error } = await supabase
			.from("categories")
			.select("*")
			.order("name");

		if (error) throw error;
		return data;
	},

	/**
	 * Create a new category
	 */
	async createCategory(data: CategoryFormData): Promise<Category> {
		const { data: category, error } = await supabase
			.from("categories")
			.insert({ name: data.name })
			.select()
			.single();

		if (error) throw error;
		return category;
	},

	/**
	 * Update a category
	 */
	async updateCategory(id: string, data: CategoryFormData): Promise<Category> {
		const { data: category, error } = await supabase
			.from("categories")
			.update({ name: data.name })
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return category;
	},

	/**
	 * Delete a category (this will remove it from all customers)
	 */
	async deleteCategory(id: string): Promise<void> {
		const { error } = await supabase.from("categories").delete().eq("id", id);

		if (error) throw error;
	},

	/**
	 * Get category usage statistics
	 */
	async getCategoryStats(): Promise<Record<string, number>> {
		const { data, error } = await supabase.from("customer_categories").select(`
        category_id,
        categories(name)
      `);

		if (error) throw error;

		// Count usage per category
		const stats: Record<string, number> = {};
		data.forEach((item) => {
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore // Supabase does not type tables.
			const categoryName = item.categories?.name;
			if (categoryName) {
				stats[categoryName] = (stats[categoryName] || 0) + 1;
			}
		});

		return stats;
	},
};

/**
 * Utility functions for customer data
 */
export const customerUtils = {
	/**
	 * Format Indian phone number for display
	 */
	formatPhoneNumber(phone: string): string {
		// Formats "9876543210" to "98765 43210"
		return phone.replace(/(\d{5})(\d{5})/, "$1 $2");
	},

	/**
	 * Generate customer initials for avatar
	 */
	getCustomerInitials(name: string): string {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	},

	/**
	 * Generate consistent background color for customer avatar
	 */
	getAvatarColor(name: string): string {
		const faraalColors = [
			"#FF8C42", // --faraal-saffron
			"#FFB347", // --faraal-gold
			"#B85450", // --faraal-terracotta
			"#464C56", // --faraal-dark-gray
			"#717680", // --faraal-medium-gray
		];

		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}

		return faraalColors[Math.abs(hash) % faraalColors.length];
	},

	/**
	 * Validate Indian phone number
	 */
	isValidIndianPhone(phone: string): boolean {
		const cleaned = phone.replace(/\D/g, "");
		return /^[6-9]\d{9}$/.test(cleaned);
	},

	/**
	 * Clean phone number (remove non-digits)
	 */
	cleanPhoneNumber(phone: string): string {
		return phone.replace(/\D/g, "");
	},
};
