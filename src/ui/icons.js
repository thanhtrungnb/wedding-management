/* Bộ biểu tượng nét mảnh, cùng độ dày nét. */
export const ICON = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M9 9.5c0-1 1-1.8 3-1.8s3 .8 3 1.8-1 1.6-3 2.2-3 1.1-3 2.1 1 1.9 3 1.9 3-.9 3-1.9"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  sliders:'<path d="M4 7h8M16 7h4M4 17h4M12 17h8"/><circle cx="13" cy="7" r="2.5"/><circle cx="9" cy="17" r="2.5"/>',
  user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.2-3.5 3.8-5 7-5s5.8 1.5 7 5"/>',
  heart:'<path d="M12 20s-7.2-4.6-9.2-9.1C1.6 8 3.5 4.8 6.6 4.8c1.9 0 3.4 1 4.4 2.7 1-1.7 2.5-2.7 4.4-2.7 3.1 0 5 3.2 3.8 6.1C17.2 15.4 12 20 12 20z"/>',
  save:'<path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14"/>',
  sync:'<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v5m0 2.5v.5"/>',
};
ICON.chev='<path d="M9 6l6 6-6 6"/>'; ICON.plus='<path d="M12 5v14M5 12h14"/>'; ICON.x='<path d="M6 6l12 12M18 6L6 18"/>'; ICON.down='<path d="M6 9l6 6 6-6"/>'; ICON.search='<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>'; ICON.note='<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h4"/>';
ICON.copy='<rect x="9" y="9" width="11" height="11" rx="1"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>';
ICON.pencil='<path d="M4 20l1.2-4.2L16.4 4.6a2.1 2.1 0 0 1 3 3L8.2 18.8 4 20z"/><path d="M14.5 6.5l3 3"/>';
ICON.trash='<path d="M4 7h16M9.5 7V4h5v3M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>';
export const svg = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
