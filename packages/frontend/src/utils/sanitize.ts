/**
 * HTML Sanitization Utilities
 *
 * Provides XSS protection through HTML sanitization using DOMPurify.
 * Always sanitize user-generated content before rendering.
 *
 * @module utils/sanitize
 */

import DOMPurify from 'dompurify';

/**
 * DOMPurify configuration for safe HTML
 */
const SANITIZE_CONFIG = {
  // Allow only basic formatting tags
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  // Allow only href attribute for links
  ALLOWED_ATTR: ['href', 'title', 'class', 'id'],
  // Disallow data attributes (can be used for XSS)
  ALLOW_DATA_ATTR: false,
  // Allow URI schemes
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Remove all HTML comments
  ALLOW_UNKNOWN_PROTOCOLS: false,
  // Forbid HTML5 data attributes
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  // Forbid specific attributes
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Sanitize HTML string to prevent XSS attacks
 *
 * Removes dangerous HTML tags, attributes, and JavaScript code.
 * Use this before rendering user-generated content.
 *
 * @param html - HTML string to sanitize
 * @param config - Optional custom DOMPurify config
 * @returns Sanitized HTML string
 *
 * @example
 * ```tsx
 * const userContent = '<script>alert("XSS")</script><p>Hello</p>';
 * const clean = sanitizeHtml(userContent);
 * // Returns: '<p>Hello</p>'
 *
 * <div dangerouslySetInnerHTML={{ __html: clean }} />
 * ```
 */
export const sanitizeHtml = (html: string, config?: DOMPurify.Config): string => {
  if (!html) return '';

  try {
    return DOMPurify.sanitize(html, {
      ...SANITIZE_CONFIG,
      ...config,
    });
  } catch (error) {
    console.error('[sanitize] Error sanitizing HTML:', error);
    // Return empty string if sanitization fails
    return '';
  }
};

/**
 * Escape HTML entities to prevent XSS
 *
 * Use this for text content (not HTML).
 * Escapes special characters to their HTML entity equivalents.
 *
 * @param text - Text to escape
 * @returns Escaped text
 *
 * @example
 * ```tsx
 * const userInput = '<script>alert("XSS")</script>';
 * const escaped = escapeHtml(userInput);
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * <div>{escaped}</div> // Safe, displays as text
 * ```
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitize URL to prevent javascript: and other dangerous protocols
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if dangerous
 *
 * @example
 * ```tsx
 * const url = sanitizeUrl('javascript:alert("XSS")');
 * // Returns: '' (empty, dangerous)
 *
 * const safeUrl = sanitizeUrl('https://example.com');
 * // Returns: 'https://example.com'
 *
 * <a href={url}>Link</a>
 * ```
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';

  try {
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase().trim();

    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        console.warn('[sanitize] Dangerous URL detected:', url);
        return ''; // Return empty string for dangerous URLs
      }
    }

    // Validate URL format
    try {
      new URL(url);
      return url;
    } catch {
      // Invalid URL format
      return '';
    }
  } catch (error) {
    console.error('[sanitize] Error sanitizing URL:', error);
    return '';
  }
};

/**
 * Create a safe href attribute value
 *
 * Combines sanitization with URL validation.
 *
 * @param url - URL to make safe
 * @returns undefined if dangerous, otherwise the sanitized URL
 *
 * @example
 * ```tsx
 * const href = makeSafeHref('javascript:alert(1)');
 * // Returns: undefined
 *
 * <a href={href || '#'}>Link</a> // Falls back to # if dangerous
 * ```
 */
export const makeSafeHref = (url: string): string | undefined => {
  const sanitized = sanitizeUrl(url);
  return sanitized || undefined;
};

/**
 * Strict HTML sanitization for user-generated content
 *
 * More restrictive than sanitizeHtml - only allows text formatting.
 *
 * @param html - HTML to sanitize
 * @returns Sanitized HTML
 *
 * @example
 * ```tsx
 * const comment = sanitizeStrict(userComment);
 * // Only allows: b, i, em, strong, br, p
 * ```
 */
export const sanitizeStrict = (html: string): string => {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize class names to prevent XSS
 *
 * @param classNames - Class names to sanitize
 * @returns Sanitized class string
 *
 * @example
 * ```tsx
 * const classes = sanitizeClassName('test " onclick="alert(1) valid');
 * // Returns: 'test valid'
 * ```
 */
export const sanitizeClassName = (...classNames: (string | undefined | false | null)[]): string => {
  return classNames
    .filter(Boolean)
    .flatMap((cn) => (cn || '').split(' '))
    .filter((cn) => {
      // Remove empty or malicious class names
      if (!cn) return false;

      // Block classes with special characters that could be dangerous
      if (/['"<>(){}]/.test(cn)) {
        console.warn('[sanitize] Invalid class name:', cn);
        return false;
      }

      return true;
    })
    .join(' ');
};
