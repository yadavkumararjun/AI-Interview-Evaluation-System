import { Brain, Sparkles, TrendingUp } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

function Navbar({ onReset, onOpenDashboard, currentView }) {
  return (
    <header className="nav">
      <div
        className="brand"
        onClick={onReset}
        role={onReset ? "button" : undefined}
        tabIndex={onReset ? 0 : undefined}
        onKeyDown={(e) => {
          if (onReset && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onReset();
          }
        }}
        aria-label="Interview AI Home"
      >
        <div className="logo">
          <Brain size={20} aria-hidden="true" />
        </div>
        <span className="brandTitle">
          Interview<span className="brandAccent">AI</span>
        </span>
      </div>

      <div className="navActions">
        <div className="navBadges" aria-hidden="true">
          <span className="navBadge">
            <Sparkles size={13} />
            7 Stages
          </span>
          <span className="navBadge">AI Feedback</span>
        </div>

        {onOpenDashboard && (
          <button
            type="button"
            className={`navDashboardBtn ${currentView === "dashboard" ? "active" : ""}`}
            onClick={onOpenDashboard}
            aria-label="Open Progress & Analytics Dashboard"
          >
            <TrendingUp size={14} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}

export default Navbar;