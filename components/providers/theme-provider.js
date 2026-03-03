"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dashboard-theme";

const ThemeContext = createContext({ theme: "corporate", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("corporate");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "prism") setThemeState("prism");
    } catch {}
  }, []);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
    if (t === "prism") {
      document.documentElement.dataset.theme = "prism";
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─── Chart colour palettes per theme ─── */

export const THEME_CHART_COLORS = {
  corporate: ["#2B7CE9", "#59A9FF", "#070E1A", "#4A6FA5", "#93C5FD", "#1E40AF", "#000055"],
  prism: ["#6C5CE7", "#0EA5E9", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6", "#06B6D4"],
};

export const THEME_CHART_GRADIENTS = {
  corporate: {
    strokes: ["#2B7CE9", "#59A9FF", "#070E1A", "#4A6FA5"],
    fills: ["#2B7CE9", "#59A9FF", "#070E1A", "#4A6FA5"],
  },
  prism: {
    strokes: ["#6C5CE7", "#0EA5E9", "#F59E0B", "#10B981"],
    fills: ["#6C5CE7", "#0EA5E9", "#F59E0B", "#10B981"],
  },
};

export const THEME_TOOLTIP = {
  corporate: {
    bg: "bg-white/95",
    border: "border-[#D8E1EB]",
    shadow: "shadow-[0_8px_32px_rgba(7,14,26,0.12)]",
    label: "text-[#8896A8]",
    name: "text-[#070E1A]/70",
    value: "text-[#070E1A]",
  },
  prism: {
    bg: "bg-[#FFFDF9]/95",
    border: "border-[#DDD5C8]",
    shadow: "shadow-[0_8px_32px_rgba(45,42,36,0.10)]",
    label: "text-[#A09787]",
    name: "text-[#2D2A24]/70",
    value: "text-[#2D2A24]",
  },
};

export const THEME_GRID = {
  corporate: "#E8F1FF",
  prism: "#EDE8F8",
};

export const THEME_AXIS = {
  corporate: "#8896A8",
  prism: "#A09787",
};

export const THEME_CENTER_LABEL = {
  corporate: "#070E1A",
  prism: "#2D2A24",
};
