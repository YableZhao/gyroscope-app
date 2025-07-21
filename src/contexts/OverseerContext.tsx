import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UserData, OverseerContextState } from '../types';

const OverseerContext = createContext<OverseerContextState | null>(null);

export const useOverseerContext = () => {
  const context = useContext(OverseerContext);
  if (!context) {
    throw new Error('useOverseerContext must be used within an OverseerContextProvider');
  }
  return context;
};

interface OverseerContextProviderProps {
  children: ReactNode;
}

export const OverseerContextProvider: React.FC<OverseerContextProviderProps> = ({ 
  children 
}) => {
  const [users, setUsers] = useState<Map<string, UserData>>(new Map());
  const [timestamp, setTimestamp] = useState<number>(0);

  const updateTimestamp = useCallback(() => {
    setTimestamp(Date.now());
  }, []);

  const update = useCallback((data: Partial<UserData>, username = 'client') => {
    setUsers(prevUsers => {
      const newUsers = new Map(prevUsers);
      const existingUser = newUsers.get(username);
      
      if (!existingUser) {
        // Create new user if doesn't exist
        const newUser: UserData = {
          username,
          alpha: 0,
          beta: 0,
          gamma: 0,
          update: () => console.warn('Default update function called'),
          ...data
        };
        newUsers.set(username, newUser);
      } else {
        // Update existing user
        newUsers.set(username, { ...existingUser, ...data });
      }
      
      return newUsers;
    });
    updateTimestamp();
  }, [updateTimestamp]);

  const addUser = useCallback((userData: UserData) => {
    console.log('Adding user:', userData.username);
    
    setUsers(prevUsers => {
      const newUsers = new Map(prevUsers);
      
      if (newUsers.has(userData.username)) {
        console.warn(`User ${userData.username} already exists`);
        return prevUsers;
      }
      
      newUsers.set(userData.username, userData);
      return newUsers;
    });
    
    updateTimestamp();
  }, [updateTimestamp]);

  const removeUser = useCallback((username: string) => {
    console.log('Removing user:', username);
    
    setUsers(prevUsers => {
      const newUsers = new Map(prevUsers);
      newUsers.delete(username);
      return newUsers;
    });
    
    updateTimestamp();
  }, [updateTimestamp]);

  const contextValue: OverseerContextState = {
    users,
    timestamp,
    update,
    addUser,
    removeUser
  };

  return (
    <OverseerContext.Provider value={contextValue}>
      {children}
    </OverseerContext.Provider>
  );
};