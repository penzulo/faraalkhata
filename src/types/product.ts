export interface Product {
	id: string;
	created_at: string;
	name: string;
	unit_of_measure: string;
	sell_price: number;
	current_stock: number;
}

export interface ProductWithCurrentPrice extends Product {
	current_cost_price: number;
}

export interface ProductFormData {
	name: string;
	unit_of_measure: string;
	sell_price: number;
	cost_price: number;
}

export interface PriceHistory {
	id: string;
	created_at: string;
	product_id: string;
	cost_price: number;
	effective_from_date: string;
}
