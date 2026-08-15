import { BASE_URL } from '@env';

// Real production backend, used only if `.env`/`@env` fails to inline BASE_URL
// (e.g. a stale Metro cache). Never a private LAN IP: those only work on a
// developer's own network and silently break the app for every real user,
// and previously several screens fell back to one instead of this.
const FALLBACK_BASE_URL = 'https://api.gbnsocialassociations.in/api/';

function normalizeBaseUrl(url) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return FALLBACK_BASE_URL;

  // Allow plain HTTP for local development hosts (localhost and private
  // LAN IP ranges). For all other hosts, prefer HTTPS to protect tokens
  // and payment data. This keeps development ergonomics while enforcing
  // secure transport in production and for public hosts.
  const hasScheme = /^https?:\/\//i.test(trimmed);
  const assumedForParsing = hasScheme ? trimmed : `http://${trimmed}`;

  let hostname = '';
  try {
    hostname = new URL(assumedForParsing).hostname;
  } catch (e) {
    // If URL parsing fails, fall back to the original behavior and force HTTPS
    const withScheme = hasScheme ? trimmed : `https://${trimmed}`;
    const httpsOnly = withScheme.replace(/^http:\/\//i, 'https://');
    return httpsOnly.endsWith('/') ? httpsOnly : `${httpsOnly}/`;
  }

  const isPrivateHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

  if (isPrivateHost) {
    // Preserve http if user provided it, otherwise allow http by default
    const out = hasScheme ? trimmed : `http://${trimmed}`;
    return out.endsWith('/') ? out : `${out}/`;
  }

  // For non-local hosts, always use HTTPS
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;
  const httpsOnly = withScheme.replace(/^http:\/\//i, 'https://');
  return httpsOnly.endsWith('/') ? httpsOnly : `${httpsOnly}/`;
}

// Canonical, safe base URL. Always ends with a single trailing slash and
// already includes the `/api/` segment, so every call site should compose
// endpoints as `${API_BASE_URL}member/profile`, never
// `${API_BASE_URL}/api/member/profile` (that produces a broken .../api/api/
// path — a bug that previously existed in a few screens).
export const API_BASE_URL = normalizeBaseUrl(BASE_URL);

/**
 * Turns a stored relative upload path (e.g. `uploads/flyers/foo.jpg`) into a
 * fetchable URL against the same origin as the API. Mirrors the inline
 * `BASE_URL.replace('/api/', '/') + path` pattern already used in
 * MembersScreen.js, centralized here so new screens don't re-derive it.
 */
export const getAssetUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  return API_BASE_URL.replace('/api/', '/') + relativePath.replace(/\\/g, '/');
};
