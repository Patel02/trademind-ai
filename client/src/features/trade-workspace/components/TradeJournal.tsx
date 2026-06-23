import React, { useState, useEffect } from "react";
import { Save, BookOpen, Check } from "lucide-react";

interface TradeJournalProps {
  symbol: string;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ symbol }) => {
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load notes from localStorage when symbol changes
  useEffect(() => {
    const savedNotes = localStorage.getItem(`journal_${symbol}`);
    setNotes(savedNotes || "");
    setSaveSuccess(false);
  }, [symbol]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      localStorage.setItem(`journal_${symbol}`, notes);
      setIsSaving(false);
      setSaveSuccess(true);
      console.log(`[Trade Journal] Saved notes for ${symbol}:`, notes);
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 800);
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BookOpen size={16} style={{ color: "var(--accent-purple)" }} />
          <span style={{ fontSize: "13px", fontWeight: "750", color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Trade Journal
          </span>
        </div>
        {notes && (
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Drafting for {symbol}
          </span>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={`Write your trade hypothesis, technical triggers, entry plan, or emotions for ${symbol} here...`}
        style={{
          width: "100%",
          flex: 1,
          minHeight: "100px",
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "12px",
          color: "var(--text-primary)",
          fontFamily: "inherit",
          fontSize: "13px",
          lineHeight: "1.5",
          resize: "none",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(170, 59, 255, 0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {saveSuccess ? (
            <span style={{ color: "var(--accent-green)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Check size={12} /> Notes saved in local storage!
            </span>
          ) : (
            "No internet required"
          )}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "6px",
            background: saveSuccess 
              ? "rgba(16, 185, 129, 0.15)" 
              : "linear-gradient(135deg, rgba(170, 59, 255, 0.15) 0%, rgba(170, 59, 255, 0.05) 100%)",
            border: saveSuccess 
              ? "1px solid rgba(16, 185, 129, 0.35)" 
              : "1px solid rgba(170, 59, 255, 0.35)",
            color: saveSuccess ? "var(--accent-green)" : "var(--accent-purple)",
            fontWeight: "650",
            fontSize: "12px",
            cursor: isSaving ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!isSaving && !saveSuccess) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(170, 59, 255, 0.25) 0%, rgba(170, 59, 255, 0.1) 100%)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSaving && !saveSuccess) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(170, 59, 255, 0.15) 0%, rgba(170, 59, 255, 0.05) 100%)";
              e.currentTarget.style.transform = "none";
            }
          }}
        >
          <Save size={13} className={isSaving ? "spin-animation" : ""} />
          {isSaving ? "Saving..." : saveSuccess ? "Saved" : "Save Notes"}
        </button>
      </div>
    </div>
  );
};

export default TradeJournal;
