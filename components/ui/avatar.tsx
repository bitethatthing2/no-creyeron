'use client';

"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<React.ElementRef<typeof Image>, AvatarImageProps>(
  ({ className, alt = "", src }, ref) => {
    if (!src) return null;
    
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        sizes="(max-width: 768px) 80px, (max-width: 1200px) 120px, 160px"
        quality={95}
        priority
      />
    );
  }
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
