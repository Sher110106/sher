'use client';

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function RatingDisplay({ 
  rating, 
  count, 
  size = "md", 
  className,
  showText = true 
}: RatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
  const roundedRating = Math.round(rating * 2) / 2;

  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const containerSizes = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5"
  };

  return (
    <div className={cn("flex items-center", containerSizes[size], className)}>
      <div className="flex">
        {[...Array(5)].map((_, i) => {
          const starIndex = i + 1;
          if (starIndex <= fullStars) {
            return <Star key={i} className={cn(starSizes[size], "fill-yellow-400 text-yellow-400")} />;
          }
          if (starIndex === fullStars + 1 && rating % 1 >= 0.75) {
             return <Star key={i} className={cn(starSizes[size], "fill-yellow-400 text-yellow-400")} />;
          }
          if (starIndex === fullStars + 1 && hasHalfStar) {
            return <StarHalf key={i} className={cn(starSizes[size], "fill-yellow-400 text-yellow-400")} />;
          }
          return <Star key={i} className={cn(starSizes[size], "text-gray-300 dark:text-gray-600")} />;
        })}
      </div>
      
      {showText && (
        <div className="flex items-center gap-1 ml-1">
          <span className={cn(
            "font-bold",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {rating.toFixed(1)}
          </span>
          {count !== undefined && (
            <span className={cn(
              "text-muted-foreground",
              size === "sm" ? "text-[10px]" : "text-xs"
            )}>
              ({count})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
