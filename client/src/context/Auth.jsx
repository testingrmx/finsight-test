import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { A } from '../services/api.js';

const Ctx = createContext(null);

const clearAllAppStorage = () => {
  const keysToRemove = Object.keys(localStorage).filter(k =>
    k.startsWith('fs_') || k === '_tok' || k === '_usr'
  );
  keysToRemove.forEach(k => localStorage.removeItem(k));
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem('_usr')); } catch { return null; } });
  const [loading, setLoading] = useState(true);
  const [dark,    setDark]    = useState(() => localStorage.getItem('_dk') !== '0');

  useEffect(() => {
    document.documentElement.setAttribute('data-dk', dark ? '1' : '0');
    localStorage.setItem('_dk', dark ? '1' : '0');
  }, [dark]);

  useEffect(() => {
    const tok = localStorage.getItem('_tok');
    if (!tok) { setLoading(false); return; }
    A.me()
      .then(({ data }) => { setUser(data.user); localStorage.setItem('_usr', JSON.stringify(data.user)); })
      .catch(() => { clearAllAppStorage(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((tok, u) => {
    clearAllAppStorage();
    localStorage.setItem('_tok', tok);
    localStorage.setItem('_usr', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearAllAppStorage();
    setUser(null);
  }, []);

  const setU = useCallback(u => {
    setUser(u);
    localStorage.setItem('_usr', JSON.stringify(u));
  }, []);

  const toggleDk = useCallback(() => setDark(d => !d), []);

  return (
    <Ctx.Provider value={{ user, loading, dark, login, logout, setU, toggleDk }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
