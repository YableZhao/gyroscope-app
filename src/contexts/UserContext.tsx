import React, { createContext, useContext, ReactNode } from 'react';
import type { UserData, UserContextState } from '../types';

export const UserContext = createContext<UserContextState>({
  users: new Map<string, UserData>(),
  timestamp: 0
});

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};

interface UserContextProviderProps {
  children: ReactNode;
  value: UserContextState;
}

export const UserContextProvider: React.FC<UserContextProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};