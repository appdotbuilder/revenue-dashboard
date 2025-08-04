
import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '../../../server/src/schema';

interface ProductFilterProps {
  products: Product[];
  selectedProductIds: number[];
  onSelectionChange: (productIds: number[]) => void;
}

export function ProductFilter({ products, selectedProductIds, onSelectionChange }: ProductFilterProps) {
  const [open, setOpen] = useState(false);

  const selectedProducts = products.filter((product: Product) => 
    selectedProductIds.includes(product.id)
  );

  const toggleProduct = (productId: number) => {
    const isSelected = selectedProductIds.includes(productId);
    if (isSelected) {
      onSelectionChange(selectedProductIds.filter((id: number) => id !== productId));
    } else {
      onSelectionChange([...selectedProductIds, productId]);
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Products</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedProductIds.length === 0 ? (
              "All products"
            ) : (
              `${selectedProductIds.length} product${selectedProductIds.length > 1 ? 's' : ''} selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search products..." />
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[200px]">
                {products.map((product: Product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => toggleProduct(product.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedProductIds.includes(product.id) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {product.description}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected products display */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedProducts.map((product: Product) => (
            <Badge key={product.id} variant="secondary" className="text-xs">
              {product.name}
              <button
                onClick={() => toggleProduct(product.id)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
