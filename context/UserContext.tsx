import React, { createContext, useContext, useState } from 'react';
import { API_BASE_URL } from '../constants';

/* type User = {
  username: string;
  email: string;
} | null; */
type User = {
  id: string; // <--- Añade el id
  username: string;
  email: string;
} | null;

type UserContextType = {
  user: User;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = (`${API_BASE_URL}/auth/login`);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext debe usarse dentro de un UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error('No se pudo parsear JSON:', text);
        return false;
      }

      if (result.status === 200 && result.data) {
        setUser({
          id: result.data.idUsuario, // <--- Guarda el idUsuario
          username: result.data.alias,
          email: email,
        });
        console.log('Usuario guardado en contexto:', {
        id: result.data.idUsuario,
        username: result.data.alias,
        email: email,
      });
        return true;
      } else {
        console.warn('Login fallido:', result.message);
        return false;
      }
    } catch (err) {
      console.error('Error al hacer login:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error('useUser debe usarse dentro de un UserProvider');
  return context;
};
