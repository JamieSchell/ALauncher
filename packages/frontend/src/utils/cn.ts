/**
 * Utility function to merge class names
 * Combines Tailwind classes and handles conflicts
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

