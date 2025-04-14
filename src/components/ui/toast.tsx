import * as React from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full backdrop-blur-sm',
  {
    variants: {
      variant: {
        default:
          'bg-background/95 border-border/30 text-foreground shadow-[0_4px_14px_rgba(0,118,255,0.25)] hover:shadow-[0_6px_20px_rgba(71,120,255,0.35)] transition-all duration-300 relative overflow-hidden after:absolute after:inset-px after:rounded-lg after:-z-[5]',
        destructive:
          'bg-background/95 border-destructive/40 text-foreground shadow-[0_4px_14px_rgba(255,50,50,0.25)] hover:shadow-[0_6px_20px_rgba(255,50,50,0.35)] transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-500/10 before:via-red-400/10 before:to-red-500/10 before:opacity-50 before:transition-opacity before:duration-500 before:-z-10 after:absolute after:inset-px after:rounded-lg after:-z-[5]',
        success:
          'bg-background/95 border-green-600/40 text-foreground shadow-[0_4px_14px_rgba(0,200,100,0.25)] hover:shadow-[0_6px_20px_rgba(0,200,100,0.35)] transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/10 before:via-green-400/10 before:to-green-500/10 before:opacity-50 before:transition-opacity before:duration-500 before:-z-10 after:absolute after:inset-px after:rounded-lg after:-z-[5]',
        warning:
          'bg-background/95 border-amber-500/40 text-foreground shadow-[0_4px_14px_rgba(255,180,0,0.25)] hover:shadow-[0_6px_20px_rgba(255,180,0,0.35)] transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-500/10 before:via-orange-400/10 before:to-amber-500/10 before:opacity-50 before:transition-opacity before:duration-500 before:-z-10 after:absolute after:inset-px after:rounded-lg after:-z-[5]',
        info: 'bg-background/95 border-cyan-500/40 text-foreground shadow-[0_4px_14px_rgba(0,180,255,0.25)] hover:shadow-[0_6px_20px_rgba(0,180,255,0.35)] transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-cyan-500/10 before:via-blue-400/10 before:to-cyan-500/10 before:opacity-50 before:transition-opacity before:duration-500 before:-z-10 after:absolute after:inset-px after:rounded-lg after:-z-[5]',
        gradient:
          'bg-background/95 border-border/30 text-foreground shadow-[0_4px_14px_rgba(0,118,255,0.25)] hover:shadow-[0_6px_20px_rgba(71,120,255,0.35)] transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-cyan-500/10 before:via-blue-500/10 before:to-purple-500/10 before:opacity-50 before:transition-opacity before:duration-500 hover:before:opacity-70 before:-z-10 after:absolute after:inset-px after:rounded-lg after:-z-[5]',
      },
    },
    defaultVariants: {
      variant: 'gradient',
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white font-medium shadow-[0_4px_14px_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(71,120,255,0.5)] hover:scale-105 transition-all duration-300 text-center relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-pink-500 before:via-purple-500 before:to-indigo-500 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-70 before:-z-10 after:absolute after:inset-px after:rounded-lg after:bg-black/80 after:-z-[5] group-[.destructive]:after:bg-red-950/90 group-[.destructive]:from-red-500 group-[.destructive]:via-red-600 group-[.destructive]:to-red-500 group-[.destructive]:before:from-orange-500 group-[.destructive]:before:via-red-500 group-[.destructive]:before:to-red-600',
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-100 transition-opacity hover:text-foreground focus:outline-none focus:ring-2 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=''
    {...props}
  >
    <Cross2Icon className='h-4 w-4' />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold tracking-tight text-foreground', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-95 leading-relaxed text-foreground/90', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
