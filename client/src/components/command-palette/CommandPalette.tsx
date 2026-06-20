import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutDashboard, TrendingUp, BrainCircuit, Radio, Newspaper, Bookmark, Dices, User, CornerDownLeft, Activity, ShieldCheck, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  name: string;
  type: "page" | "stock";
  path: string;
  icon: React.ReactNode;
  subtitle?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = [
    // Pages
    { name: "Go to Dashboard", type: "page", path: "/dashboard", icon: <LayoutDashboard size={16} />, subtitle: "Overview of your portfolio and signals" },
    { name: "Go to Markets", type: "page", path: "/markets", icon: <TrendingUp size={16} />, subtitle: "Real-time stock rates and index statistics" },
    { name: "Go to AI Analysis", type: "page", path: "/analysis", icon: <BrainCircuit size={16} />, subtitle: "Smart model reviews and trading pulse" },
    { name: "Go to Signals", type: "page", path: "/signals", icon: <Radio size={16} />, subtitle: "Decision support and timing matrix" },
    { name: "Go to Performance Ledger", type: "page", path: "/signals/performance", icon: <Activity size={16} />, subtitle: "Audited closed setups and win rate stats" },
    { name: "Go to Admin SIOS Lifecycle", type: "page", path: "/admin/signals", icon: <ShieldCheck size={16} />, subtitle: "Publish setups, audits, and learning DNA (Admin Only)" },
    { name: "Go to News", type: "page", path: "/news", icon: <Newspaper size={16} />, subtitle: "Financial events and global news summaries" },
    { name: "Go to Watchlist", type: "page", path: "/watchlist", icon: <Bookmark size={16} />, subtitle: "Tracked tickers and alerts" },
    { name: "Go to Paper Trading", type: "page", path: "/paper-trading", icon: <Dices size={16} />, subtitle: "Risk-free strategy testing" },
    { name: "Go to Portfolio Doctor", type: "page", path: "/portfolio-doctor", icon: <HeartPulse size={16} />, subtitle: "Hedge-fund risk analytics and rebalancing simulation" },
    { name: "Go to Profile Settings", type: "page", path: "/profile", icon: <User size={16} />, subtitle: "Manage your credentials and configurations" },
    
    // Stocks
    { name: "TCS (Tata Consultancy Services)", type: "stock", path: "/markets?ticker=TCS", icon: <TrendingUp size={16} />, subtitle: "NSE: TCS" },
    { name: "RELIANCE (Reliance Industries)", type: "stock", path: "/markets?ticker=RELIANCE", icon: <TrendingUp size={16} />, subtitle: "NSE: RELIANCE" },
    { name: "HDFCBANK (HDFC Bank)", type: "stock", path: "/markets?ticker=HDFCBANK", icon: <TrendingUp size={16} />, subtitle: "NSE: HDFCBANK" },
    { name: "INFY (Infosys Limited)", type: "stock", path: "/markets?ticker=INFY", icon: <TrendingUp size={16} />, subtitle: "NSE: INFY" },
  ];

  // Filter items based on search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].path);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  const handleItemClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="command-palette-backdrop">
          {/* Backdrop overlay trigger */}
          <div className="palette-overlay" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="command-palette-modal"
          >
            {/* Search Input bar */}
            <div className="palette-search-container">
              <Search size={20} className="palette-search-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or stock ticker..."
                className="palette-search-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <span className="palette-esc-badge" onClick={onClose}>ESC</span>
            </div>

            {/* List Results */}
            <div className="palette-results">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <div
                    key={item.path}
                    className={`palette-item ${index === selectedIndex ? "selected" : ""}`}
                    onClick={() => handleItemClick(item.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="palette-item-left">
                      <div className="palette-item-icon">{item.icon}</div>
                      <div className="palette-item-text">
                        <span className="palette-item-name">{item.name}</span>
                        {item.subtitle && (
                          <span className="palette-item-subtitle">{item.subtitle}</span>
                        )}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="palette-item-enter">
                        <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", marginRight: "4px" }}>Select</span>
                        <CornerDownLeft size={12} />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="palette-no-results">
                  No commands or tickers match "{search}"
                </div>
              )}
            </div>

            {/* Footer guide */}
            <div className="palette-footer">
              <div className="palette-guide-item">
                <span>↑↓</span> to navigate
              </div>
              <div className="palette-guide-item">
                <span>↵</span> to select
              </div>
              <div className="palette-guide-item">
                <span>Ctrl+K</span> to toggle
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
