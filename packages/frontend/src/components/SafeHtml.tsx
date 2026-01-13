/**
 * SafeHtml Component
 *
 * Safely renders HTML content with XSS protection.
 * Always use this component instead of dangerouslySetInnerHTML.
 *
 * @example
 * ```tsx
 * // Good: SafeHtml component with sanitization
 * <SafeHtml html={userContent} />
 *
 * // Bad: Direct dangerouslySetInnerHTML (XSS vulnerable)
 * <div dangerouslySetInnerHTML={{ __html: userContent }} />
 * ```
 */

import { useMemo } from 'react';
import { sanitizeHtml } from '../utils/sanitize';

interface SafeHtmlProps {
  /** HTML string to render (will be sanitized) */
  html: string;
  /** CSS class name */
  className?: string;
  /** Tag name to use (default: div) */
  tag?: 'div' | 'span' | 'p' | 'article' | 'section';
  /** Whether to use strict sanitization (default: false) */
  strict?: boolean;
  /** Custom DOMPurify configuration */
  config?: DOMPurify.Config;
}

/**
 * Safely renders HTML content with automatic XSS protection
 *
 * All HTML is sanitized through DOMPurify before rendering.
 * Dangerous tags (script, iframe, etc.) and attributes (onclick, etc.) are removed.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({
  html,
  className = '',
  tag = 'div',
  strict = false,
  config,
}) => {
  // Memoize sanitization to avoid re-processing on every render
  const cleanHtml = useMemo(() => {
    if (strict) {
      // Use strict sanitization (only basic formatting)
      return sanitizeHtml(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
        ALLOWED_ATTR: [],
        ...config,
      });
    }

    // Use standard sanitization
    return sanitizeHtml(html, config);
  }, [html, strict, config]);

  // Render with appropriate tag
  const Tag = tag;

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

/**
 * SafeText Component for rendering text content
 *
 * Automatically escapes HTML entities to prevent XSS.
 *
 * @example
 * ```tsx
 * <SafeText text={userInput} />
 * ```
 */
interface SafeTextProps {
  /** Text to render (will be HTML-escaped) */
  text: string;
  /** CSS class name */
  className?: string;
  /** Tag name to use (default: span) */
  tag?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

import { escapeHtml } from '../utils/sanitize';

export const SafeText: React.FC<SafeTextProps> = ({
  text,
  className = '',
  tag = 'span',
}) => {
  const Tag = tag;
  // Escape HTML entities
  const escapedText = escapeHtml(text || '');

  return <Tag className={className}>{escapedText}</Tag>;
};

/**
 * SafeLink Component for secure links
 *
 * Validates and sanitizes URLs to prevent javascript: and other dangerous protocols.
 *
 * @example
 * ```tsx
 * <SafeLink href={userUrl}>Click me</SafeLink>
 * ```
 */
interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** URL to validate and render */
  href: string;
  /** Children to render */
  children: React.ReactNode;
  /** Fallback href if validation fails (default: #) */
  fallbackHref?: string;
  /** Whether to open in new tab (default: false) */
  external?: boolean;
}

import { makeSafeHref } from '../utils/sanitize';

export const SafeLink: React.FC<SafeLinkProps> = ({
  href,
  children,
  fallbackHref = '#',
  external = false,
  className = '',
  ...props
}) => {
  const safeHref = makeSafeHref(href) || fallbackHref;

  return (
    <a
      href={safeHref}
      className={className}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  );
};

export default SafeHtml;
