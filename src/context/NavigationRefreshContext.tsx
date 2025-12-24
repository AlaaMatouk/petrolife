import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface NavigationRefreshContextType {
  triggerRefresh: (key: string) => void;
  registerRefreshHandler: (key: string, handler: () => void) => void;
  unregisterRefreshHandler: (key: string) => void;
}

const NavigationRefreshContext = createContext<NavigationRefreshContextType | undefined>(undefined);

export const NavigationRefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshHandlers, setRefreshHandlers] = useState<Map<string, () => void>>(new Map());

  const registerRefreshHandler = useCallback((key: string, handler: () => void) => {
    setRefreshHandlers((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, handler);
      return newMap;
    });
  }, []);

  const unregisterRefreshHandler = useCallback((key: string) => {
    setRefreshHandlers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const triggerRefresh = useCallback((key: string) => {
    const handler = refreshHandlers.get(key);
    if (handler) {
      handler();
    } else {
      console.warn(`No refresh handler registered for key: ${key}`);
    }
  }, [refreshHandlers]);

  return (
    <NavigationRefreshContext.Provider
      value={{
        triggerRefresh,
        registerRefreshHandler,
        unregisterRefreshHandler,
      }}
    >
      {children}
    </NavigationRefreshContext.Provider>
  );
};

export const useNavigationRefresh = () => {
  const context = useContext(NavigationRefreshContext);
  if (!context) {
    throw new Error("useNavigationRefresh must be used within NavigationRefreshProvider");
  }
  return context;
};

