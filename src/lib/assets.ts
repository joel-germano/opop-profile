// Bump this whenever the underlying file in public/ changes, so caches
// (browser, service worker, CDN) can never keep serving a stale version.
const PERSONA_ICON_VERSION = 2;

export const PERSONA_ICON_SRC = `/persona-icon.png?v=${PERSONA_ICON_VERSION}`;
