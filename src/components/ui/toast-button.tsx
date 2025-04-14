import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ToastButtonProps {
  href: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

export function ToastButton({
  href,
  onClick,
  className,
  children,
  variant = 'default',
}: ToastButtonProps) {
  const variantStyles = {
    default:
      'from-cyan-400 via-blue-500 to-purple-500 before:from-pink-500 before:via-purple-500 before:to-indigo-500',
    destructive:
      'from-red-500 via-red-600 to-red-500 before:from-orange-500 before:via-red-500 before:to-red-600',
    success:
      'from-green-400 via-green-500 to-emerald-500 before:from-emerald-500 before:via-green-500 before:to-teal-500',
    warning:
      'from-amber-400 via-orange-500 to-amber-500 before:from-orange-500 before:via-amber-500 before:to-yellow-500',
    info: 'from-cyan-400 via-blue-500 to-indigo-500 before:from-blue-500 before:via-cyan-500 before:to-blue-500',
  }

  return (
    <Link
      href={href}
      className={cn(
        'inline-block px-4 py-2.5 rounded-lg bg-gradient-to-r text-white font-medium shadow-[0_4px_14px_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(71,120,255,0.5)] hover:scale-105 transition-all duration-300 text-center relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-r before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-70 before:-z-10 after:absolute after:inset-px after:rounded-lg after:bg-black/80 after:-z-[5]',
        variantStyles[variant],
        className
      )}
      onClick={onClick}
    >
      <span className='relative z-10'>{children}</span>
    </Link>
  )
}
