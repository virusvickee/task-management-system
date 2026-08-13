"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = ({
  modal = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root modal={modal} {...props} />
)

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, collisionPadding = 16, onOpenAutoFocus, onCloseAutoFocus, onFocusOutside, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        onOpenAutoFocus?.(event)
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        onCloseAutoFocus?.(event)
      }}
      onFocusOutside={(event) => {
        event.preventDefault()
        onFocusOutside?.(event)
      }}
      className={cn(
        "app-popover-content z-[9999] w-[min(18rem,calc(100vw-24px))] max-w-[calc(100vw-24px)] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-gray-900 dark:text-gray-100 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
