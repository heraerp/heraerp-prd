"use client";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Cycle through themes: dark → light → system → dark
  const cycleTheme = () => {
    switch(theme) {
      case "dark":
        setTheme("light");
        break;
      case "light":
        setTheme("system");
        break;
      case "system":
        setTheme("dark");
        break;
    }
  };

  // Get current theme icon
  const getIcon = () => {
    switch(theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Get theme label for tooltip
  const getThemeLabel = () => {
    switch(theme) {
      case "light":
        return "Light mode";
      case "dark":
        return "Dark mode";
      case "system":
        return "System mode";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label={`Current theme: ${getThemeLabel()}. Click to cycle to next theme.`}
      title={getThemeLabel()}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 dark:bg-white/5 backdrop-blur-md ink hover:bg-white/20 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      {getIcon()}
    </button>
  );
}