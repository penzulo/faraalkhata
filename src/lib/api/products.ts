import { supabase } from "@/lib/supabase";
import type {
	Product,
	ProductFormData,
	ProductWithCurrentPrice,
} from "@/types/product";

export const productsApi = {
	async getProducts(): Promise<ProductWithCurrentPrice[]> {
		const { data, error } = await supabase
			.from("products")
			.select(`
        *,
        product_price_history!inner(
          cost_price,
          effective_from_date
        )
      `)
			.order("name");

		if (error) throw error;

		const productsWithCurrentPrice = data.map((product) => {
			const sortedHistory = product.product_price_history.sort(
				// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
				// @ts-ignore // Supabase does not type tables.
				(a, b) =>
					new Date(b.effective_from_date).getTime() -
					new Date(a.effective_from_date).getTime(),
			);

			return {
				...product,
				current_cost_price: sortedHistory[0]?.cost_price || null,
				product_price_history: undefined,
			};
		});

		return productsWithCurrentPrice;
	},

	async createProduct(data: ProductFormData): Promise<Product> {
		const { data: product, error: productError } = await supabase
			.from("products")
			.insert({
				name: data.name,
				unit_of_measure: data.unit_of_measure,
				sell_price: data.sell_price,
			})
			.select()
			.single();

		if (productError) throw productError;

		const { error: historyError } = await supabase
			.from("product_price_history")
			.insert({
				product_id: product.id,
				cost_price: data.cost_price,
				effective_from_date: new Date().toISOString(),
			});

		if (historyError) {
			await supabase.from("products").delete().eq("id", product.id);
			throw historyError;
		}

		return product;
	},

	async updateProduct(id: string, data: ProductFormData): Promise<Product> {
		const { data: currentProduct } = await supabase
			.from("products")
			.select(`
				*,
				product_price_history!inner(cost_price, effective_from_date)
			`)
			.eq("id", id)
			.single();
		if (!currentProduct) throw new Error("Product not found");

		const { data: updatedProduct, error: updateError } = await supabase
			.from("products")
			.update({
				name: data.name,
				unit_of_measure: data.unit_of_measure,
				sell_price: data.sell_price,
			})
			.eq("id", id)
			.select()
			.single();

		if (updateError) throw updateError;

		const sortedHistory = currentProduct.product_price_history.sort(
			// biome-ignore lint/suspicious/noTsIgnore: supabase does not type tables.
			// @ts-ignore // Supabase does not type tables.
			(a, b) =>
				new Date(b.effective_from_date).getTime() -
				new Date(a.effective_from_date).getTime(),
		);
		const currentCostPrice = sortedHistory[0]?.cost_price;

		if (currentCostPrice !== data.cost_price) {
			const { error: historyError } = await supabase
				.from("product_price_history")
				.insert({
					product_id: id,
					cost_price: data.cost_price,
					effective_from_date: new Date().toISOString(),
				});

			if (historyError) throw historyError;
		}

		return updatedProduct;
	},

	async deleteProduct(id: string): Promise<void> {
		const { error } = await supabase.from("products").delete().eq("id", id);

		if (error) throw error;
	},
};
