"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface StoreFiltersProps {
  brands: Brand[];
  categories: Category[];
}

export function StoreFilters({ brands, categories }: StoreFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category");
  const selectedBrand = searchParams.get("brand");

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategory === slug) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    router.push(`/store?${params.toString()}`);
  };

  const handleBrandChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedBrand === slug) {
      params.delete("brand");
    } else {
      params.set("brand", slug);
    }
    router.push(`/store?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/store");
  };

  const hasFilters = selectedCategory || selectedBrand;

  return (
    <div className="bg-white rounded-lg border border-charcoal/10 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-charcoal">
          Filters
        </h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-charcoal-light hover:text-gold"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-medium text-charcoal text-sm uppercase tracking-wider">
          Categories
        </h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategory === category.slug}
                onCheckedChange={() => handleCategoryChange(category.slug)}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-sm text-charcoal-light cursor-pointer hover:text-charcoal"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3 pt-6 border-t border-charcoal/10">
        <h4 className="font-medium text-charcoal text-sm uppercase tracking-wider">
          Brands
        </h4>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand.id}`}
                checked={selectedBrand === brand.slug}
                onCheckedChange={() => handleBrandChange(brand.slug)}
              />
              <Label
                htmlFor={`brand-${brand.id}`}
                className="text-sm text-charcoal-light cursor-pointer hover:text-charcoal"
              >
                {brand.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
