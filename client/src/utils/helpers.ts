/**
 * Compute a deterministic gradient for a user's avatar based on their name.
 */
export function avatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg,#7c6af7,#a78bfa)',
    'linear-gradient(135deg,#f97316,#fb923c)',
    'linear-gradient(135deg,#06b6d4,#22d3ee)',
    'linear-gradient(135deg,#10b981,#34d399)',
    'linear-gradient(135deg,#ec4899,#f472b6)',
    'linear-gradient(135deg,#eab308,#fbbf24)',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

/**
 * Format bytes into a human-readable string.
 */
export function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Return an emoji icon for a given file name/extension.
 */
export function getFileIcon(name?: string): string {
  if (!name) return '📄';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: '📕', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📊', pptx: '📊', zip: '🗜️', rar: '🗜️', mp3: '🎵',
    mp4: '🎬', mov: '🎬', txt: '📄', js: '💻', ts: '💻',
    py: '🐍', html: '🌐', css: '🎨',
  };
  return map[ext] ?? '📄';
}

/**
 * Return WebSocket URL pointing at the backend (port 5000).
 * Uses window.location.hostname so LAN users automatically resolve
 * the correct server IP — works for localhost AND any network IP.
 */
export function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Always use the hostname of the page — works for localhost AND LAN IPs
  return `${proto}//${window.location.hostname}:5000`;
}

/**
 * Build a date label string from a timestamp.
 */
export function buildDateLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a timestamp as HH:MM.
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Sanitize a string for safe display (strip HTML brackets).
 */
export function sanitizeDisplay(str?: string): string {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Read a file as a base64 data URL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
