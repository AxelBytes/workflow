/**
 * Contexto de Autenticación compartido
 * Proporciona el estado del usuario a toda la app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  userEmail: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userEmail: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] 🔐 Iniciando listener de autenticación...');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[AuthContext] 👤 Estado de auth cambió:', firebaseUser?.email || 'No autenticado');
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => {
      console.log('[AuthContext] 🧹 Limpiando listener...');
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    userEmail: user?.email || null,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;

