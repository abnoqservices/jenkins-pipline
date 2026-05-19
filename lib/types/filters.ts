export interface ProductFilters {
    search: string;           // product name search
    categories: string[];     // selected categories
    priceMin: number;
    priceMax: number;
  }
  
  export const initialFilters: ProductFilters = {
    search: '',
    categories: [],
    priceMin: 0,
    priceMax: 100000,         // high enough to cover all your mock prices
  };