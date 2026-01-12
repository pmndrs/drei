import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for proper class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
