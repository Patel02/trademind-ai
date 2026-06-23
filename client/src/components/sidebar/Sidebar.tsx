import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  BrainCircuit, 
  Radio, 
  Newspaper, 
  Bookmark, 
  Dices, 
  User, 
  ChevronLeft, 
  ChevronRight,
  X,
  Sparkles,
  Activity,
  ShieldCheck,
  HeartPulse,
  CandlestickChart,
  Briefcase,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onMobileClose,
}) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Markets", path: "/markets", icon: TrendingUp },
    { name: "AI Analysis", path: "/analysis", icon: BrainCircuit },
    { name: "Signals", path: "/signals", icon: Radio },
    { name: "Performance", path: "/signals/performance", icon: Activity },
    { name: "Admin Panel", path: "/admin/signals", icon: ShieldCheck },
    { name: "News", path: "/news", icon: Newspaper },
    { name: "Watchlist", path: "/watchlist", icon: Bookmark },
    { name: "Paper Trading", path: "/paper-trading", icon: Dices },
    { name: "Portfolio", path: "/portfolio", icon: Briefcase },
    { name: "Trade History", path: "/history", icon: History },
    { name: "Trade Workspace", path: "/trade/TCS", icon: CandlestickChart },
    { name: "Portfolio Doctor", path: "/portfolio/doctor", icon: HeartPulse },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const sidebarWidth = isCollapsed ? "80px" : "280px";

  const renderNavLinks = () => {
    return menuItems.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onMobileClose}
          className={`sidebar-nav-item ${isActive ? "active" : ""}`}
        >
          <div className="nav-icon-container">
            <Icon size={20} />
          </div>
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="nav-text"
              >
                {item.name}
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      );
    });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={onMobileClose} />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`sidebar-container 
          ${isCollapsed ? "collapsed" : ""} 
          ${isMobileOpen ? "mobile-open" : ""}`}
        style={{ width: sidebarWidth }}
      >
        {/* Mobile Header Close button */}
        <div className="sidebar-mobile-header">
          <div className="header-brand">
            <Sparkles size={20} className="brand-icon" />
            <span className="brand-text">TradeMind AI</span>
          </div>
          <button className="sidebar-close-btn" onClick={onMobileClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          {renderNavLinks()}
        </nav>

        {/* Footer/Collapse Toggle */}
        <div className="sidebar-footer">
          <button 
            className="collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : (
              <>
                <ChevronLeft size={18} />
                <span className="toggle-text">Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
