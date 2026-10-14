import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="themeToggleGroup"
      role="radiogroup"
      aria-label="Theme switcher"
    >
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        className={`themeBtn ${theme === "light" ? "active" : ""}`}
        onClick={() => setTheme("light")}
        aria-label="Switch to Light Theme"
        title="Light theme"
      >
        <Sun size={15} aria-hidden="true" />
        <span>Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        className={`themeBtn ${theme === "dark" ? "active" : ""}`}
        onClick={() => setTheme("dark")}
        aria-label="Switch to Dark Theme"
        title="Dark theme"
      >
        <Moon size={15} aria-hidden="true" />
        <span>Dark</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
