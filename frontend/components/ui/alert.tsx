import * as React from "react"
import { cn } from "@/lib/utils"

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-lg border border-border bg-card p-4 text-foreground [&>svg]:h-4 [&>svg]:w-4",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
        {children}
      </h5>
    )
  },
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("text-sm [&:not(:first-child)]:mt-1", className)} {...props}>
        {children}
      </div>
    )
  },
)
AlertDescription.displayName = "AlertDescription"

import { Circle } from "lucide-react"

const AlertCircle = React.forwardRef<SVGSVGElement, React.HTMLAttributes<SVGSVGElement>>(
  ({ className, ...props }, ref) => <Circle ref={ref} className={cn("h-4 w-4", className)} {...props} />,
)
AlertCircle.displayName = "AlertCircle"

export { Alert, AlertTitle, AlertDescription, AlertCircle }
