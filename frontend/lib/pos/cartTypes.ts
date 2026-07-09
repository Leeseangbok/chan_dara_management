import { Product } from "../api/types";

export interface CartLine {
    product: Product;
    quantity: number;
    unitPrice: number;
}
