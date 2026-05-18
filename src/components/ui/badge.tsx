import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Maps shadcn badge variants onto gecko-badge classes from the design system.
const badgeVariants = cva("gecko-badge", {
  variants: {
    variant: {
      default: "gecko-badge-primary",
      primary: "gecko-badge-primary",
      secondary: "gecko-badge-gray",
      destructive: "gecko-badge-error",
      outline: "gecko-badge-gray",
      success: "gecko-badge-success",
      warning: "gecko-badge-warning",
      info: "gecko-badge-info",
      accent: "gecko-badge-accent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
