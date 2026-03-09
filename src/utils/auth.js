// ─── Role Constants ────────────────────────────────────────────────────────
// These must match the role names set in Strapi Admin →
// Settings → Users & Permissions → Roles
export const ROLES = {
  ADMIN:  'admin',
  EDITOR: 'editor',
  READER: 'reader',
};

// Role hierarchy: higher index = more permissions
const ROLE_LEVEL = {
  [ROLES.READER]: 0,
  [ROLES.EDITOR]: 1,
  [ROLES.ADMIN]:  2,
};

// ─── Permission Helpers ────────────────────────────────────────────────────
export const can = {
  addShloka:    (role) => ROLE_LEVEL[role] >= ROLE_LEVEL[ROLES.EDITOR],
  editShloka:   (role) => ROLE_LEVEL[role] >= ROLE_LEVEL[ROLES.EDITOR],
  deleteShloka: (role) => ROLE_LEVEL[role] >= ROLE_LEVEL[ROLES.ADMIN],
  manageUsers:  (role) => ROLE_LEVEL[role] >= ROLE_LEVEL[ROLES.ADMIN],
  viewContent:  (role) => ROLE_LEVEL[role] >= ROLE_LEVEL[ROLES.READER],
};

// ─── localStorage Keys ─────────────────────────────────────────────────────
const TOKEN_KEY = 'shloka_jwt';
const USER_KEY  = 'shloka_user';

// ─── Token Storage ─────────────────────────────────────────────────────────
export const saveSession = (jwt, user) => {
  localStorage.setItem(TOKEN_KEY, jwt);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Role Extraction ───────────────────────────────────────────────────────
// Strapi returns role under user.role.type (Users & Permissions plugin)
export const extractRole = (strapiUser) => {
  return strapiUser?.role?.type || ROLES.READER;
};
