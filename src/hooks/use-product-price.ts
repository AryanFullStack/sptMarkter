import { useAuth } from "@/context/auth-context";
import { useMemo } from "react";

export interface Product {
  price_customer: number;
  price_retailer: number;
  price_beauty_parlor: number;
  [key: string]: any;
}

export function useProductPrice(product: Product | null | undefined) {
  const { userRole, loading } = useAuth();

  const priceData = useMemo(() => {
    if (!product) {
      return { price: 0, label: "Price", loading: true };
    }

    if (loading) {
        // Return default customer price while loading to prevent CLS, 
        // but maybe with a loading indicator if strictly needed.
        // For now, we return customer price as fallback.
        return { 
            price: product.price_customer || 0, 
            label: "Customer Price",
            loading: true 
        };
    }

    switch (userRole) {
      case "beauty_parlor":
        return {
          price: product.price_beauty_parlor || 0,
          label: "Your Beauty Parlor Price",
          loading: false,
        };
      case "retailer":
        return {
          price: product.price_retailer || 0,
          label: "Your Retailer Price",
          loading: false,
        };
      case "customer":
      case "local_customer":
      default:
        return {
          price: product.price_customer || 0,
          label: "Price",
          loading: false,
        };
    }
  }, [product, userRole, loading]);

  return priceData;
}
