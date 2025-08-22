'use client';

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import type { MerchItem } from '@/types/features/merch';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductCardProps {
  product: MerchItem;
  onViewDetails: (product: MerchItem) => void;
}

export const ProductCard = ({ product, onViewDetails }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Placeholder for image loading or error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/product-placeholder.jpg';
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <div className="relative">
        <AspectRatio ratio={1/1}>
          <Image 
            src={product.image || '/images/product-placeholder.jpg'} 
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleImageError}
          />
        </AspectRatio>
        {product.popular && (
          <Badge 
            variant="default" 
            className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm"
          >
            Popular
          </Badge>
        )}
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{product.name}</CardTitle>
          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
        </div>
        {product.description && (
          <CardDescription className="mt-1.5 line-clamp-2">
            {product.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardFooter className="p-4 pt-2 flex justify-end">
        <Button 
          size="sm" 
          onClick={() => onViewDetails(product)}
          disabled={!product.in_stock}
          className="gap-1"
        >
          <ShoppingBag className="h-4 w-4" />  
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
