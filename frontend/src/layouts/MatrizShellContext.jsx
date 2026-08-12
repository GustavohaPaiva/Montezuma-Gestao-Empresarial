import { createContext, useContext } from "react";

const MatrizShellContext = createContext(null);

export function MatrizShellProvider({ value, children }) {
  return (
    <MatrizShellContext.Provider value={value}>
      {children}
    </MatrizShellContext.Provider>
  );
}

export function useMatrizShell() {
  return useContext(MatrizShellContext);
}
