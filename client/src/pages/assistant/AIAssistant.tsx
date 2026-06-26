import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Bot,
  User,
  Zap
} from "lucide-react";
import { aiAssistantService } from "../../features/assistant/ai-assistant.service";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts
  const suggestionChips = [
    "Analyze TCS",
    "Why is my portfolio risky?",
    "Which sector should I add?",
    "Show my best trade setup",
    "What changed today?",
    "Compare TCS vs INFY"
  ];

  // Load initial welcome message
  useEffect(() => {
    const welcomeMsg: Message = {
      id: "welcome",
      sender: "ai",
      text: `Hello! I am your **TradeMind AI Assistant**. I provide context-aware insights about your active portfolio, trade setups, news and market intelligence.

Here are some specific queries I can help you with:
- **"Analyze TCS"** — Reviews TCS price, technical setup, and your position.
- **"Why is my portfolio risky?"** — Audits your asset concentration, sector weights, and liquidity.
- **"Which sector should I add?"** — Detects underexposed sectors to hedge risk.
- **"Show my best trade setup"** — Highlights your highest-yielding active or closed trade.
- **"What changed today?"** — Displays today's portfolio values and active smart alerts.
- **"Compare TCS vs INFY"** — Side-by-side technical comparison of TCS and INFY.

*How can I help you today?*`,
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, []);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await aiAssistantService.sendMessage(text);
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: response,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-err`,
        sender: "ai",
        text: "I encountered an issue processing your query. Please try again.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear chat history?")) {
      const welcomeMsg = messages.find(m => m.id === "welcome") || {
        id: "welcome",
        sender: "ai",
        text: "How can I help you today?",
        timestamp: new Date()
      } as Message;
      setMessages([welcomeMsg]);
    }
  };

  // Helper function to render text with markdown parsing (bold, headers, bullets, tables)
  const renderMessageText = (text: string) => {
    const lines = text.split("\n");
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const elements = lines.map((line, idx) => {
      // 1. Table Parsing
      if (line.trim().startsWith("|")) {
        const parts = line.split("|").map(p => p.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        if (line.includes("---")) {
          return null; // Skip table header lines
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = parts;
          return null;
        } else {
          tableRows.push(parts);
          return null;
        }
      } else {
        if (inTable) {
          inTable = false;
          const currentHeaders = [...tableHeaders];
          const currentRows = [...tableRows];
          tableHeaders = [];
          tableRows = [];
          return (
            <div key={`table-${idx}`} style={{ overflowX: "auto", margin: "14px 0", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", background: "rgba(0,0,0,0.2)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                    {currentHeaders.map((h, i) => (
                      <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontWeight: "750", color: "#fff" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: ri === currentRows.length - 1 ? "none" : "1px solid rgba(255,255,255,0.03)" }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }

      // 2. Headings
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} style={{ fontSize: "15px", fontWeight: "800", color: "#fff", margin: "14px 0 6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
            {parseInlineMarkdown(line.substring(4))}
          </h3>
        );
      }

      // 3. Bullets
      if (line.startsWith("- ")) {
        return (
          <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", margin: "4px 0", paddingLeft: "4px", fontSize: "13px", lineHeight: "1.4" }}>
            <span style={{ color: "var(--accent-purple)", marginTop: "2px" }}>•</span>
            <span style={{ color: "var(--text-secondary)" }}>{parseInlineMarkdown(line.substring(2))}</span>
          </div>
        );
      }

      // 4. Paragraph/Line
      if (line.trim() === "") {
        return <div key={idx} style={{ height: "6px" }} />;
      }

      return (
        <p key={idx} style={{ margin: "4px 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          {parseInlineMarkdown(line)}
        </p>
      );
    }).filter(el => el !== null);

    return elements;
  };

  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "#fff", fontWeight: "700" }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", padding: "1.5rem 2rem 2rem" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem", flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
              TradeMind AI Assistant
            </h1>
            <Badge variant="success" style={{ fontSize: "9px", textTransform: "uppercase", fontWeight: "750" }}>
              Live Context
            </Badge>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", marginTop: "3px", margin: 0 }}>
            Hedge-fund analytics chatbot querying live portfolio risk weights, market DNA, and news logs
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleClearHistory}
          icon={<Trash2 size={13} />}
          style={{ borderColor: "rgba(239, 68, 68, 0.2)", color: "var(--accent-red)", padding: "6px 12px", fontSize: "12px" }}
        >
          Clear History
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", flexGrow: 1, overflow: "hidden" }} className="responsive-split-row">
        
        {/* CHAT CONTAINER */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          
          {/* Messages Area */}
          <div style={{ flexGrow: 1, padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isAI = msg.sender === "ai";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      display: "flex",
                      justifyContent: isAI ? "flex-start" : "flex-end",
                      width: "100%"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      gap: "10px",
                      maxWidth: "75%",
                      flexDirection: isAI ? "row" : "row-reverse",
                      alignItems: "flex-start"
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: isAI ? "rgba(168, 85, 247, 0.15)" : "rgba(59, 130, 246, 0.15)",
                        border: `1px solid ${isAI ? "rgba(168, 85, 247, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        {isAI ? <Bot size={15} color="var(--accent-purple)" /> : <User size={15} color="var(--accent-blue)" />}
                      </div>

                      {/* Bubble */}
                      <div style={{
                        background: isAI ? "rgba(255, 255, 255, 0.02)" : "linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)",
                        border: isAI ? "1px solid var(--border)" : "none",
                        borderRadius: isAI ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                        padding: "10px 14px",
                        color: isAI ? "var(--text-secondary)" : "#fff",
                        boxShadow: isAI ? "none" : "0 4px 12px rgba(109, 40, 217, 0.15)"
                      }}>
                        {isAI ? renderMessageText(msg.text) : (
                          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{msg.text}</p>
                        )}
                        <span style={{ display: "block", fontSize: "8.5px", opacity: 0.5, marginTop: "4px", textAlign: isAI ? "left" : "right" }}>
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Typing Loader Bubble */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(168, 85, 247, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Bot size={15} color="var(--accent-purple)" />
                    </div>
                    <div style={{
                      background: "rgba(255, 255, 255, 0.015)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px 16px 16px 16px",
                      padding: "12px 18px",
                      display: "flex",
                      gap: "4px"
                    }}>
                      <span className="typing-dot" style={{ width: "6px", height: "6px", background: "var(--text-secondary)", borderRadius: "50%", display: "inline-block" }}></span>
                      <span className="typing-dot" style={{ width: "6px", height: "6px", background: "var(--text-secondary)", borderRadius: "50%", display: "inline-block", animationDelay: "0.2s" }}></span>
                      <span className="typing-dot" style={{ width: "6px", height: "6px", background: "var(--text-secondary)", borderRadius: "50%", display: "inline-block", animationDelay: "0.4s" }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-action chips */}
          <div style={{ padding: "0.5rem 1rem", borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.1)", overflowX: "auto", display: "flex", gap: "8px", whiteSpace: "nowrap", flexShrink: 0 }} className="scrollbar-hidden">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  fontWeight: "650",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(168, 85, 247, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <Zap size={10} color="var(--accent-purple)" />
                <span>{chip}</span>
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            style={{ padding: "1rem", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask TradeMind AI (e.g. 'Analyze TCS', 'Why is my portfolio risky?')..."
              style={{
                flexGrow: 1,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!input.trim()}
              icon={<Send size={13} />}
              style={{ padding: "10px 18px", fontSize: "13px" }}
            >
              Send
            </Button>
          </form>

        </div>

        {/* SIDE PANELS: Guide Instructions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", overflowY: "auto" }}>
          
          {/* Quick Guide Card */}
          <Card 
            title="Assistant Copilot Guide" 
            subtitle="Deep context vs Generic ChatGPT knowledge"
            extra={<Sparkles size={16} color="var(--accent-purple)" />}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              <p style={{ margin: 0 }}>
                Standard AI chatbots provide generic definitions. TradeMind AI queries your actual account logs to calculate answers.
              </p>
              
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                <strong style={{ color: "#fff", fontSize: "11.5px", display: "block", marginBottom: "6px" }}>INTELLIGENCE FEEDS USED:</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ display: "inline-block", width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent-green)" }}></span>
                    <span>Portfolio Values & Cash Balances</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ display: "inline-block", width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent-green)" }}></span>
                    <span>Active and Closed Positions Log</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ display: "inline-block", width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent-green)" }}></span>
                    <span>Hedge-fund Volatility Diagnostics</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ display: "inline-block", width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent-green)" }}></span>
                    <span>Systematic Regime Beta Hedges</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Tips */}
          <Card title="Suggested Workflows">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px", color: "var(--text-secondary)" }}>
              <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px" }}>
                <span style={{ fontWeight: "700", color: "#fff", display: "block", marginBottom: "2px" }}>1. Check Portfolio Risk</span>
                <span>Type <em>"Why is my portfolio risky?"</em> to audit diversification caps.</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px" }}>
                <span style={{ fontWeight: "700", color: "#fff", display: "block", marginBottom: "2px" }}>2. Rebalance Exposure</span>
                <span>Type <em>"Which sector should I add?"</em> to identify underexposed hedges.</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)", borderRadius: "6px", padding: "8px 10px" }}>
                <span style={{ fontWeight: "700", color: "#fff", display: "block", marginBottom: "2px" }}>3. Compare Hedges</span>
                <span>Type <em>"Compare TCS vs INFY"</em> to cross-examine sectoral betas.</span>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Embedded Typing Pulsing dot CSS */}
      <style>{`
        .typing-dot {
          animation: pulse 1.2s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
};

export default AIAssistantPage;
