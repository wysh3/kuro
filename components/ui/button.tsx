import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion, HTMLMotionProps } from 'framer-motion'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/20 relative active:scale-95 transition-all duration-200",
  {
    variants: {
      variant: {
        default: 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
        destructive:
          'bg-tesla-red text-white hover:bg-tesla-red/90 shadow-[0_0_20px_rgba(232,23,30,0.15)]',
        outline:
          'border-thin bg-transparent backdrop-blur-sm hover:bg-white/5 text-white',
        secondary:
          'bg-white/5 text-white hover:bg-white/10 backdrop-blur-md border-thin',
        ghost:
          'hover:bg-white/5 text-white/70 hover:text-white',
        link: 'text-white underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn("font-black uppercase tracking-widest", buttonVariants({ variant, size, className }))}
        {...(props as any)}
      />
    )
  }

  return (
    <motion.button
      data-slot="button"
      className={cn("font-black uppercase tracking-widest", buttonVariants({ variant, size, className }))}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...(props as any)}
    />
  )
}

export { Button, buttonVariants }
