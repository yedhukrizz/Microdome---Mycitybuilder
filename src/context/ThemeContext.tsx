import React, { createContext, useContext, useState, useEffect } from 'react';

export type UITheme = 'black' | 'light';
export type GraphicsQuality = 'high' | 'balanced' | 'performance';

interface ThemeContextType {
  theme: UITheme;
  setTheme: (theme: UITheme) => void;
  toggleTheme: () => void;
  undistractedMode: boolean;
  setUndistractedMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleUndistractedMode: () => void;
  graphicsQuality: GraphicsQuality;
  setGraphicsQuality: (q: GraphicsQuality) => void;
  contactShadows: boolean;
  setContactShadows: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'black',
  setTheme: () => {},
  toggleTheme: () => {},
  undistractedMode: false,
  setUndistractedMode: () => {},
  toggleUndistractedMode: () => {},
  graphicsQuality: 'high',
  setGraphicsQuality: () => {},
  contactShadows: true,
  setContactShadows: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<UITheme>(() => {
    try {
      const saved = localStorage.getItem('skyline_ui_theme');
      if (saved === 'light' || saved === 'black') return saved;
    } catch {}
    return 'black';
  });

  const [undistractedMode, setUndistractedMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skyline_undistracted_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [graphicsQuality, setGraphicsQualityState] = useState<GraphicsQuality>(() => {
    try {
      const saved = localStorage.getItem('skyline_graphics_quality');
      if (saved === 'high' || saved === 'balanced' || saved === 'performance') return saved;
    } catch {}
    return 'high';
  });

  const [contactShadows, setContactShadowsState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('skyline_contact_shadows');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const setTheme = (newTheme: UITheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('skyline_ui_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'black' ? 'light' : 'black');
  };

  const toggleUndistractedMode = () => {
    setUndistractedMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('skyline_undistracted_mode', String(next));
      } catch {}
      return next;
    });
  };

  const setGraphicsQuality = (q: GraphicsQuality) => {
    setGraphicsQualityState(q);
    try {
      localStorage.setItem('skyline_graphics_quality', q);
    } catch {}
  };

  const setContactShadows = (val: boolean) => {
    setContactShadowsState(val);
    try {
      localStorage.setItem('skyline_contact_shadows', String(val));
    } catch {}
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-black');
      document.body.style.backgroundColor = '#f5f5f5';
      document.body.classList.remove('bg-black', 'bg-slate-950');
      document.body.classList.add('bg-neutral-100', 'text-neutral-900');
    } else {
      document.documentElement.classList.add('theme-black');
      document.documentElement.classList.remove('theme-light');
      document.body.style.backgroundColor = '#000000';
      document.body.classList.remove('bg-neutral-100', 'bg-slate-950');
      document.body.classList.add('bg-black', 'text-white');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        undistractedMode,
        setUndistractedMode,
        toggleUndistractedMode,
        graphicsQuality,
        setGraphicsQuality,
        contactShadows,
        setContactShadows,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
