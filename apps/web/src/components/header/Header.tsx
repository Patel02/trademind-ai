import React, { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Bell, Search, Menu, User, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  onSearchClick,
}) => {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsCount = 3;

  return (
    <header className="main-header">
      {/* Left: Mobile Menu Trigger & Branding */}
      <div className="header-left">
        <button 
          className="mobile-menu-trigger" 
          onClick={onMobileMenuToggle}
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-brand" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
          <Sparkles size={20} className="brand-icon" />
          <span className="brand-text">TradeMind AI</span>
        </div>
      </div>

      {/* Center: Search Box (Clicking triggers Command Palette) */}
      <div className="header-center">
        <div className="search-bar-trigger" onClick={onSearchClick}>
          <Search size={16} className="search-icon" />
          <span className="search-placeholder">Search stocks, pages...</span>
          <span className="search-hotkey">Ctrl + K</span>
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="header-right">
        {/* Theme Toggle */}
        <button 
          className="header-action-btn" 
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="notification-wrapper">
          <button className="header-action-btn" title="Notifications">
            <Bell size={18} />
            {notificationsCount > 0 && (
              <span className="notification-badge">{notificationsCount}</span>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="profile-dropdown-container">
          <button 
            className="header-profile-trigger"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="User Settings"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-fallback">
                <User size={16} />
              </div>
            )}
          </button>

          {showProfileMenu && (
            <>
              <div className="dropdown-overlay" onClick={() => setShowProfileMenu(false)} />
              <div className="profile-dropdown-menu">
                <div className="dropdown-header">
                  <span className="dropdown-name">{profile?.full_name || "Trader"}</span>
                  <span className="dropdown-email">{user?.email}</span>
                </div>
                <div className="dropdown-divider" />
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/profile");
                  }}
                >
                  My Profile
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/watchlist");
                  }}
                >
                  My Watchlist
                </button>
                <div className="dropdown-divider" />
                <button 
                  className="dropdown-item logout-item"
                  onClick={async () => {
                    setShowProfileMenu(false);
                    navigate("/login");
                  }}
                >
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
