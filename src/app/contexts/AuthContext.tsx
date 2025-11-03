// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AgentSession, Privilege, loginAgent, logoutAgent, checkSession } from '@/services/auth/authService';
import { loginUtilisateur, checkSessionUtilisateur, logoutUtilisateur } from '@/services/auth/userAuthService';

interface UtilisateurSession {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  formule?: string;
}

interface AuthContextType {
  agent: AgentSession | null;
  utilisateur: UtilisateurSession | null;
  privileges: Privilege[];
  isAuthenticated: boolean;
  userType: 'agent' | 'utilisateur' | null;
  isLoading: boolean;
  login: (identifiant: string, password: string) => Promise<{ success: boolean; message?: string; userType?: string }>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [agent, setAgent] = useState<AgentSession | null>(null);
  const [utilisateur, setUtilisateur] = useState<UtilisateurSession | null>(null);
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [userType, setUserType] = useState<'agent' | 'utilisateur' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au chargement de l'application
    const verifySession = async () => {
      try {
        // D'abord vérifier la session agent
        const agentResult = await checkSession();
        if (agentResult.status === 'success' && agentResult.data) {
          setAgent(agentResult.data.agent);
          setPrivileges(agentResult.data.privileges);
          setUserType('agent');
          setIsLoading(false);
          return;
        }

        // Si pas d'agent, vérifier la session utilisateur
        const userResult = await checkSessionUtilisateur();
        if (userResult.status === 'success' && userResult.data) {
          setUtilisateur(userResult.data.utilisateur);
          setUserType('utilisateur');
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Session verification failed:', error);
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (identifiant: string, password: string) => {
    try {
      // Essayer d'abord de se connecter en tant qu'agent (avec email)
      const agentResult = await loginAgent(identifiant, password);
      
      if (agentResult.status === 'success' && agentResult.data) {
        setAgent(agentResult.data.agent);
        setPrivileges(agentResult.data.privileges);
        setUserType('agent');
        return { success: true, userType: 'agent' };
      }

      // Si échec, essayer de se connecter en tant qu'utilisateur (avec téléphone)
      const userResult = await loginUtilisateur(identifiant, password);
      
      if (userResult.status === 'success' && userResult.data) {
        setUtilisateur(userResult.data.utilisateur);
        setUserType('utilisateur');
        return { success: true, userType: 'utilisateur' };
      }

      // Si les deux échouent, retourner l'erreur de l'utilisateur
      return { 
        success: false, 
        message: userResult.message || 'Identifiants incorrects' 
      };

    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Erreur lors de la connexion' };
    }
  };

  const logout = async () => {
    try {
      if (userType === 'agent') {
        await logoutAgent();
      } else if (userType === 'utilisateur') {
        await logoutUtilisateur();
      }
      
      setAgent(null);
      setUtilisateur(null);
      setPrivileges([]);
      setUserType(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (userType !== 'agent' || !agent) return false;
    
    return privileges.some(
      privilege => 
        privilege.module === module && 
        privilege.action === action && 
        privilege.selected
    );
  };

  const value: AuthContextType = {
    agent,
    utilisateur,
    privileges,
    isAuthenticated: !!agent || !!utilisateur,
    userType,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};