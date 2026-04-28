import crypto from 'crypto';

/**
 * Generate a short random ID
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Sanitize a string for safe storage (strip HTML, trim, cap length)
 */
export function sanitize(str: unknown, maxLen = 2000): string {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim().slice(0, maxLen);
}

/**
 * Hash a plain-text password with SHA-256
 */
export function hashPassword(pw: string): string {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

/**
 * Format file size in human-readable form
 */
export function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
