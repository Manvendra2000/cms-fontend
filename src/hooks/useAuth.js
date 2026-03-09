import { useState, useEffect, useCallback } from 'react';
import {
  saveSession, clearSession,
  getStoredToken, getStoredUser,
  extractRole,
} from '../utils/auth';
import { STRAPI_URL } from '../utils/constants';

/**
 * useAuth — single source of truth for authentication.
 *
 * Returns:
 *   user      — full Strapi user object (or null)
 *   role      — 'admin' | 'editor' | 'reader' (or null)
 *   token     — JWT string (or null)
 *   loading   — true while verifying stored session on mount
 *   error     — login error message (or null)
 *   login()   — async fn(email, password) → throws on failure
 *   logout()  — clears session
 */
export const useAuth = () => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [role,    setRole]    = useState(null);
  const [loading, setLoading] = useState(true); // starts true — verifying stored session
  const [error,   setError]   = useState(null);

  // ── On mount: restore session from localStorage & re-verify with Strapi ──
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = getStoredToken();
      const storedUser  = getStoredUser();

      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        // Re-verify token is still valid and fetch fresh user+role data
        const res = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!res.ok) {
          // Token expired or revoked — clear and force re-login
          clearSession();
          setLoading(false);
          return;
        }

        const freshUser = await res.json();
        const freshRole = extractRole(freshUser);

        setToken(storedToken);
        setUser(freshUser);
        setRole(freshRole);
        saveSession(storedToken, freshUser); // refresh stored user data
      } catch {
        // Network error — use stored data as fallback so app still works offline
        setToken(storedToken);
        setUser(storedUser);
        setRole(extractRole(storedUser));
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier, password) => {
    setError(null);
    try {
      // Step 1: authenticate and get JWT
      const authRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier, password }),
      });

      const authData = await authRes.json();

      if (!authRes.ok) {
        const msg = authData?.error?.message || 'Invalid credentials.';
        setError(msg);
        throw new Error(msg);
      }

      const jwt = authData.jwt;

      // Step 2: fetch full user profile including role
      const meRes = await fetch(`${STRAPI_URL}/api/users/me?populate=role`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      const meData = await meRes.json();
      const userRole = extractRole(meData);

      // Step 3: persist and set state
      saveSession(jwt, meData);
      setToken(jwt);
      setUser(meData);
      setRole(userRole);

      return { user: meData, role: userRole };
    } catch (err) {
      const msg = err.message || 'Login failed. Please try again.';
      setError(msg);
      throw err;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setRole(null);
    setError(null);
  }, []);

  return { user, token, role, loading, error, login, logout };
};
