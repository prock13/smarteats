import { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";

type ThemeVariant = 'professional' | 'tint' | 'vibrant';
type ThemeAppearance = 'light' | 'dark' | 'system';

interface ThemeSettings {
  primary: string;
  variant: ThemeVariant;
  appearance: ThemeAppearance;
  radius: number;
}

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (settings: Partial<ThemeSettings>) => void;
}

const defaultTheme: ThemeSettings = {
  primary: "#2E7D32",
  variant: "professional",
  appearance: "system",
  radius: 0.5
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [persistedTheme, setPersistedTheme] = useLocalStorage<ThemeSettings>(
    "app-theme",
    defaultTheme
  );
  const [theme, setTheme] = useState<ThemeSettings>(persistedTheme);

  useEffect(() => {
    // Update CSS variables and theme.json when theme changes
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--radius', `${theme.radius}rem`);
    document.documentElement.setAttribute('data-theme', theme.appearance);
    
    // Persist theme changes
    setPersistedTheme(theme);
  }, [theme, setPersistedTheme]);

  const updateTheme = (settings: Partial<ThemeSettings>) => {
    setTheme(current => ({ ...current, ...settings }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
