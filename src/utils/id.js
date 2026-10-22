export const newId = prefix => `${prefix}_${(globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 12)}`;
