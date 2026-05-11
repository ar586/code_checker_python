"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1424",
        borderRadius: "0 0 12px 12px",
        color: "#475569",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "14px",
      }}
    >
      Loading editor...
    </div>
  ),
});

type Status = "idle" | "running" | "success" | "error" | "timeout";

interface ExecutionResult {
  output?: string | null;
  error?: string | null;
  timed_out: boolean;
  exit_code?: number | null;
}

const DEFAULT_CODE = `# Welcome to PyExec ✨
# Write your Python code below and click "Run" to execute it.

print("Hello Empower")

# Try more:
# for i in range(5):
#     print(f"Line {i + 1}: Running on the server!")
`;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function HomePage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);

  const runCode = useCallback(async () => {
    if (status === "running") return;
    setStatus("running");
    setResult(null);
    setExecTime(null);

    const start = Date.now();
    try {
      const res = await fetch(`${BACKEND_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const elapsed = Date.now() - start;
      setExecTime(elapsed);

      if (!res.ok) {
        setStatus("error");
        setResult({ output: null, error: `HTTP ${res.status}: ${res.statusText}`, timed_out: false });
        return;
      }

      const data: ExecutionResult = await res.json();
      if (data.timed_out) {
        setStatus("timeout");
      } else if (data.error && !data.output) {
        setStatus("error");
      } else {
        setStatus("success");
      }
      setResult(data);
    } catch (err) {
      setExecTime(Date.now() - start);
      setStatus("error");
      setResult({
        output: null,
        error: "Could not connect to backend. Make sure the server is running on port 8000.",
        timed_out: false,
      });
    }
  }, [code, status]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runCode]);

  const statusConfig = {
    idle: { color: "#475569", label: "Ready", dot: "#475569" },
    running: { color: "#3b82f6", label: "Executing...", dot: "#3b82f6" },
    success: { color: "#10b981", label: "Success", dot: "#10b981" },
    error: { color: "#ef4444", label: "Error", dot: "#ef4444" },
    timeout: { color: "#f59e0b", label: "Timed Out", dot: "#f59e0b" },
  };

  const current = statusConfig[status];

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── HEADER ── */}
        <header
          style={{
            borderBottom: "1px solid #1e2d50",
            background: "rgba(10,14,26,0.85)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              padding: "0 24px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                ⚡
              </div>
              <div>
                <h1 className="gradient-text" style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1 }}>
                  PyExec
                </h1>
                <p style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                  Python Execution Engine
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "20px",
                background: "rgba(19,28,53,0.8)",
                border: `1px solid ${current.color}33`,
              }}
            >
              <div
                className={status === "running" ? "blink" : ""}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: current.dot,
                }}
              />
              <span style={{ fontSize: "13px", color: current.color, fontWeight: 500 }}>
                {current.label}
              </span>
              {execTime !== null && status !== "running" && (
                <span style={{ fontSize: "12px", color: "#475569", marginLeft: "4px" }}>
                  · {execTime}ms
                </span>
              )}
            </div>

            {/* Keyboard hint */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "12px" }}>
              <kbd
                style={{
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "#131c35",
                  border: "1px solid #1e2d50",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "#94a3b8",
                }}
              >
                ⌘ Enter
              </kbd>
              <span>to run</span>
            </div>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
          {/* Info bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
              padding: "12px 20px",
              borderRadius: "12px",
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <span style={{ fontSize: "16px" }}>🐍</span>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              Python 3 · Server-side execution · 2-second timeout · Empower Global Tech AI
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              {["print('Hello Empower')", "while True: pass"].map((snippet, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i === 0) setCode(`print("Hello Empower")\n`);
                    else setCode(`# Infinite loop test — will timeout after 2 seconds\nwhile True:\n    pass\n`);
                    setStatus("idle");
                    setResult(null);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "8px",
                    background: "rgba(19,28,53,0.9)",
                    border: "1px solid #1e2d50",
                    color: "#94a3b8",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = "#3b82f6";
                    (e.target as HTMLButtonElement).style.color = "#60a5fa";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.borderColor = "#1e2d50";
                    (e.target as HTMLButtonElement).style.color = "#94a3b8";
                  }}
                >
                  {snippet}
                </button>
              ))}
            </div>
          </div>

          {/* ── EDITOR + OUTPUT GRID ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 420px",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {/* Editor panel */}
            <div
              className="glass-card glow-blue"
              style={{ overflow: "hidden" }}
            >
              {/* Editor header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid #1e2d50",
                  background: "#0f1629",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Traffic lights */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
                      <div
                        key={c}
                        style={{ width: "12px", height: "12px", borderRadius: "50%", background: c, opacity: 0.7 }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#475569",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    main.py
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#334155",
                      padding: "2px 8px",
                      background: "#0a0e1a",
                      borderRadius: "6px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Python 3
                  </span>
                </div>
              </div>

              {/* Editor */}
              <div style={{ height: "480px", overflow: "hidden" }}>
                <CodeEditor value={code} onChange={setCode} />
              </div>

              {/* Run button bar */}
              <div
                style={{
                  padding: "14px 16px",
                  borderTop: "1px solid #1e2d50",
                  background: "#0f1629",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "12px", color: "#334155" }}>
                  {code.split("\n").length} lines · {code.length} chars
                </span>

                <button
                  id="run-code-button"
                  onClick={runCode}
                  disabled={status === "running"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 28px",
                    borderRadius: "10px",
                    border: "none",
                    background:
                      status === "running"
                        ? "linear-gradient(135deg, #1e3a5f, #1e2d50)"
                        : "linear-gradient(135deg, #2563eb, #7c3aed)",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: status === "running" ? "not-allowed" : "pointer",
                    transition: "all 0.25s ease",
                    animation:
                      status !== "running" ? "pulse-blue 2s infinite" : "none",
                    letterSpacing: "0.3px",
                  }}
                  onMouseEnter={(e) => {
                    if (status !== "running") {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 8px 24px rgba(59,130,246,0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }}
                >
                  {status === "running" ? (
                    <>
                      <div className="spinner" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "16px" }}>▶</span>
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Output card */}
              <div
                className={`glass-card ${
                  status === "success"
                    ? "glow-green"
                    : status === "timeout"
                    ? "glow-yellow"
                    : status === "error"
                    ? "glow-red"
                    : ""
                }`}
                style={{ overflow: "hidden" }}
              >
                {/* Output header */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #1e2d50",
                    background: "#0f1629",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>
                      {status === "success" && "✅"}
                      {status === "error" && "❌"}
                      {status === "timeout" && "⏱️"}
                      {status === "running" && "⚙️"}
                      {status === "idle" && "📋"}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: current.color }}>
                      Output
                    </span>
                  </div>
                  {result && (
                    <button
                      onClick={() => { setResult(null); setStatus("idle"); setExecTime(null); }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#334155",
                        cursor: "pointer",
                        fontSize: "18px",
                        lineHeight: 1,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ef4444")}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#334155")}
                      title="Clear output"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Output content */}
                <div
                  style={{
                    minHeight: "200px",
                    maxHeight: "320px",
                    overflow: "auto",
                    padding: "16px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {/* Idle state */}
                  {status === "idle" && !result && (
                    <div
                      style={{
                        height: "200px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#334155",
                        gap: "12px",
                      }}
                    >
                      <div style={{ fontSize: "36px", opacity: 0.4 }}>⚡</div>
                      <p style={{ fontSize: "13px" }}>Run your code to see output</p>
                    </div>
                  )}

                  {/* Running state */}
                  {status === "running" && (
                    <div
                      style={{
                        height: "200px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#3b82f6",
                        gap: "16px",
                      }}
                    >
                      <div className="spinner" style={{ width: "28px", height: "28px", borderWidth: "3px", borderTopColor: "#3b82f6", borderColor: "#1e3a5f" }} />
                      <p style={{ fontSize: "13px", color: "#475569" }}>Executing on server...</p>
                      <p style={{ fontSize: "11px", color: "#334155" }}>Timeout in 2 seconds</p>
                    </div>
                  )}

                  {/* Success */}
                  {status === "success" && result && (
                    <div className="fade-in">
                      <pre
                        style={{
                          color: "#4ade80",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                        }}
                      >
                        {result.output || "(no output)"}
                      </pre>
                      {result.error && (
                        <pre
                          style={{
                            color: "#fbbf24",
                            whiteSpace: "pre-wrap",
                            marginTop: "12px",
                            borderTop: "1px solid #1e2d50",
                            paddingTop: "12px",
                          }}
                        >
                          {result.error}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Error */}
                  {status === "error" && result && (
                    <div className="fade-in">
                      <pre
                        style={{
                          color: "#f87171",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                        }}
                      >
                        {result.error}
                      </pre>
                    </div>
                  )}

                  {/* Timeout */}
                  {status === "timeout" && result && (
                    <div className="fade-in" style={{ padding: "16px 0" }}>
                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "10px",
                          background: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.2)",
                        }}
                      >
                        <p style={{ color: "#fbbf24", fontWeight: 600, marginBottom: "8px", fontFamily: "'Inter', sans-serif" }}>
                          ⏱️ Execution Timed Out
                        </p>
                        <p style={{ color: "#94a3b8", fontSize: "12px", fontFamily: "'Inter', sans-serif", lineHeight: "1.6" }}>
                          {result.error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Test cases panel */}
              <div className="glass-card" style={{ padding: "16px" }}>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#94a3b8",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Test Cases
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    {
                      label: "Hello World",
                      code: `print("Hello Empower")`,
                      expect: "Returns: Hello Empower",
                      icon: "✅",
                    },
                    {
                      label: "Infinite Loop",
                      code: `while True:\n    pass`,
                      expect: "Returns: Timeout error (2s)",
                      icon: "⏱️",
                    },
                  ].map((tc) => (
                    <button
                      key={tc.label}
                      id={`test-case-${tc.label.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => {
                        setCode(tc.code + "\n");
                        setStatus("idle");
                        setResult(null);
                        setExecTime(null);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "rgba(10,14,26,0.6)",
                        border: "1px solid #1e2d50",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#2563eb";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2d50";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(10,14,26,0.6)";
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#f1f5f9",
                            fontFamily: "'Inter', sans-serif",
                            marginBottom: "4px",
                          }}
                        >
                          {tc.icon} {tc.label}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#475569",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {tc.expect}
                        </p>
                      </div>
                      <span style={{ color: "#334155", fontSize: "12px" }}>Load →</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution info */}
              {result && status !== "idle" && (
                <div className="glass-card fade-in" style={{ padding: "14px 16px" }}>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "10px",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Execution Info
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { label: "Status", value: current.label, color: current.color },
                      { label: "Exit Code", value: result.exit_code?.toString() ?? "—", color: "#94a3b8" },
                      { label: "Time", value: execTime ? `${execTime}ms` : "—", color: "#94a3b8" },
                      { label: "Timed Out", value: result.timed_out ? "Yes" : "No", color: result.timed_out ? "#f59e0b" : "#10b981" },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#475569" }}>{row.label}</span>
                        <span style={{ color: row.color, fontWeight: 500 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer
          style={{
            textAlign: "center",
            padding: "24px",
            color: "#334155",
            fontSize: "13px",
            borderTop: "1px solid #1e2d50",
            marginTop: "24px",
          }}
        >
          Built for Empower Global Tech AI Pvt. Ltd. · Full Stack Web Developer Intern Assignment
        </footer>
      </div>
    </div>
  );
}
