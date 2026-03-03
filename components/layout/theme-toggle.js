"use client";

import { useTheme } from "@/components/providers/theme-provider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isPrism = theme === "prism";

  return (
    <button
      onClick={() => setTheme(isPrism ? "corporate" : "prism")}
      className="fixed bottom-5 left-5 z-50 flex items-center gap-2 h-9 pl-2.5 pr-3.5 rounded-full border backdrop-blur-xl transition-all duration-500 hover:scale-[1.04] active:scale-[0.97] cursor-pointer"
      style={{
        background: isPrism
          ? "rgba(240,235,225,0.85)"
          : "rgba(255,255,255,0.75)",
        borderColor: isPrism
          ? "rgba(124,92,231,0.3)"
          : "rgba(0,0,0,0.06)",
        boxShadow: isPrism
          ? "0 4px 24px rgba(124,92,231,0.12), 0 0 0 1px rgba(124,92,231,0.08)"
          : "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
      aria-label={`Switch to ${isPrism ? "corporate" : "prism"} theme`}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500"
        style={{
          background: isPrism
            ? "linear-gradient(135deg, #6C5CE7, #A78BFA)"
            : "linear-gradient(135deg, #2B7CE9, #59A9FF)",
          boxShadow: isPrism
            ? "0 2px 8px rgba(108,92,231,0.35)"
            : "0 2px 8px rgba(43,124,233,0.3)",
        }}
      >
        {isPrism ? (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
            <path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z" />
          </svg>
        ) : (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M4.1 4.1l1 1M10.9 10.9l1 1M4.1 11.9l1-1M10.9 5.1l1-1" />
          </svg>
        )}
      </span>
      <span
        className="text-[11px] font-medium tracking-wide transition-colors duration-500"
        style={{ color: isPrism ? "#7C5CE7" : "#6B7280" }}
      >
        {isPrism ? "Prism" : "Corporate"}
      </span>
    </button>
  );
}
