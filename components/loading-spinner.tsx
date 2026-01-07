"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className={cn("animate-spin rounded-full border-3 border-primary/20 border-t-primary", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground font-medium animate-pulse">{text}</p>}
    </div>
  )
}
