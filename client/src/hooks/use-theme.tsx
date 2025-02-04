import { createContext, useContext, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { createTheme, Theme } from "@mui/material";

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primary: string;
  borderRadius: number;
}

interface ThemeContextType {
  theme: Theme;
  settings: ThemeSettings;
  updateTheme: (settings: Partial<ThemeSettings>) => void;
}

const defaultSettings: ThemeSettings = {
  mode: 'system',
  primary: '#2E7D32',
  borderRadius: 4
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function createCustomTheme(settings: ThemeSettings): Theme {
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = settings.mode === 'system' 
    ? (systemPrefersDark ? 'dark' : 'light')
    : settings.mode;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: settings.primary,
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#ffffff',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#000000',
        secondary: mode === 'dark' ? '#b3b3b3' : '#666666',
      }
    },
    shape: {
      borderRadius: settings.borderRadius,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#000000',
          }
        }
      }
    }
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [persistedSettings, setPersistedSettings] = useLocalStorage<ThemeSettings>(
    "app-theme",
    defaultSettings
  );
  const [settings, setSettings] = useState<ThemeSettings>(persistedSettings);
  const [theme, setTheme] = useState(() => createCustomTheme(settings));

  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => setTheme(createCustomTheme(settings));

    systemPrefersDark.addEventListener('change', updateTheme);
    return () => systemPrefersDark.removeEventListener('change', updateTheme);
  }, [settings]);

  useEffect(() => {
    setTheme(createCustomTheme(settings));
    setPersistedSettings(settings);
  }, [settings, setPersistedSettings]);

  const updateTheme = (newSettings: Partial<ThemeSettings>) => {
    setSettings(current => ({ ...current, ...newSettings }));
  };

  return (
    <ThemeContext.Provider value={{ theme, settings, updateTheme }}>
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