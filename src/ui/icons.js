/* Bộ biểu tượng nét mảnh, cùng độ dày nét. */
export const ICON = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M9 9.5c0-1 1-1.8 3-1.8s3 .8 3 1.8-1 1.6-3 2.2-3 1.1-3 2.1 1 1.9 3 1.9 3-.9 3-1.9"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
};
ICON.chev='<path d="M9 6l6 6-6 6"/>'; ICON.plus='<path d="M12 5v14M5 12h14"/>'; ICON.x='<path d="M6 6l12 12M18 6L6 18"/>'; ICON.down='<path d="M6 9l6 6 6-6"/>'; ICON.search='<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>';
export const svg = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
