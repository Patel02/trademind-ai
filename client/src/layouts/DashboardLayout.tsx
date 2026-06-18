import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import CommandPalette from "../components/command-palette/CommandPalette";
import { motion, AnimatePresence } from "framer-motion";

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global listener for Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <div className="app-layout">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar 
          isMobileOpen={isMobileMenuOpen} 
          onMobileClose={() => setIsMobileMenuOpen(false)} 
        />

        {/* Right side Wrapper */}
        <div className="layout-content-wrapper">
          {/* Header containing search trigger, toggle, notifications */}
          <Header 
            onMobileMenuToggle={() => setIsMobileMenuOpen(true)} 
            onSearchClick={() => setIsCommandPaletteOpen(true)} 
          />

          {/* Main Content Pane */}
          <main className="layout-main-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ width: "100%", height: "100%" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Global Command Palette */}
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)} 
        />
      </div>
    </ThemeProvider>
  );
};

export default DashboardLayout;
