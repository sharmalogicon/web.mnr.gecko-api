import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Maps shadcn-style variant/size props onto gecko-btn classes from the shared
// design system. The same component API stays in place so calling pages don't
// need changes when this layer swaps from Tailwind utilities to gecko classes.
const buttonVariants = cva("gecko-btn", {
  variants: {
    variant: {
      default: "gecko-btn-primary",
      primary: "gecko-btn-primary",
      destructive: "gecko-btn-danger",
      outline: "gecko-btn-outline",
      secondary: "gecko-btn-secondary",
      ghost: "gecko-btn-ghost",
      link: "gecko-btn-link",
      accent: "gecko-btn-accent",
      success: "gecko-btn-success",
      warning: "gecko-btn-warning",
    },
    size: {
      default: "",
      sm: "gecko-btn-sm",
      lg: "gecko-btn-lg",
      xl: "gecko-btn-xl",
      icon: "gecko-btn-icon",
      "icon-sm": "gecko-btn-icon gecko-btn-sm",
      "icon-lg": "gecko-btn-icon gecko-btn-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
