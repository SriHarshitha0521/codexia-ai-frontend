import {
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CodeIcon from "@mui/icons-material/Code";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { useState, useEffect } from "react";
import FlowchartPanel from "../Flowchart/FlowchartPanel";
import AskPanel from "./AskPanel";

const TYPE_STYLES = {
  METHOD: {
    bg: "rgba(16,185,129,0.12)",
    border: "#10B981",
    text: "#10B981",
    label: "Method",
  },
  VARIABLE: {
    bg: "rgba(255,167,38,0.12)",
    border: "#FFA726",
    text: "#FFA726",
    label: "Variable",
  },
  RETURN: {
    bg: "rgba(102,187,106,0.12)",
    border: "#66BB6A",
    text: "#66BB6A",
    label: "Return",
  },
  CONDITION: {
    bg: "rgba(239,83,80,0.12)",
    border: "#EF5350",
    text: "#EF5350",
    label: "Condition",
  },
  IMPORT: {
    bg: "rgba(171,71,188,0.12)",
    border: "#AB47BC",
    text: "#AB47BC",
    label: "Import",
  },
  CLASS: {
    bg: "rgba(255,112,67,0.12)",
    border: "#FF7043",
    text: "#FF7043",
    label: "Class",
  },
  ANNOTATION: {
    bg: "rgba(91,79,232,0.12)",
    border: "#5B4FE8",
    text: "#8B80FF",
    label: "Annotation",
  },
  LOOP: {
    bg: "rgba(41,182,246,0.12)",
    border: "#29B6F6",
    text: "#29B6F6",
    label: "Loop",
  },
  DEFAULT: {
    bg: "rgba(100,100,120,0.1)",
    border: "#444460",
    text: "#8888AA",
    label: "Code",
  },
};

function getTypeStyle(type) {
  return TYPE_STYLES[type?.toUpperCase()] || TYPE_STYLES.DEFAULT;
}

function cleanCode(raw) {
  if (!raw) return "";
  return raw
    .replace(/```[\w]*\n?/g, "")
    .replace(/```/g, "")
    .trim();
}

function EmptyState() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        opacity: 0.4,
        p: 4,
      }}
    >
      <CodeIcon sx={{ fontSize: 44, color: "#5B4FE8" }} />
      <Typography
        sx={{
          color: "#6060A0",
          fontSize: "13px",
          textAlign: "center",
          fontFamily: "sans-serif",
          maxWidth: 200,
          lineHeight: 1.6,
        }}
      >
        Write your code on the left and click Explain Code
      </Typography>
    </Box>
  );
}

function LoadingState() {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={32} sx={{ color: "#5B4FE8" }} />
      <Typography
        sx={{ color: "#6060A0", fontSize: "12px", fontFamily: "monospace" }}
      >
        Codexi is reading your code...
      </Typography>
    </Box>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip title={copied ? "Copied!" : "Copy"}>
      <IconButton
        size="small"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        sx={{
          color: copied ? "#10B981" : "#404060",
          "&:hover": { color: "#8B80FF" },
          p: 0.5,
        }}
      >
        <ContentCopyIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  );
}

function SectionLabel({ icon, text }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
      {icon}
      <Typography
        sx={{
          fontSize: "9px",
          color: "#404060",
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          fontFamily: "sans-serif",
          fontWeight: 600,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

export default function ResultPanel({
  result,
  loading,
  level,
  code,
  language,
  showFlowchart,
  flowchartData,
  flowchartLoading,
  switchToFlowchart,
  onHighlightLine,
}) {
  // TAB STATE — "comments", "flowchart", or "ask"
  const [activeTab, setActiveTab] = useState("comments");

  // register tab switcher with App so clicking Generate Flowchart auto-switches
  useEffect(() => {
    if (switchToFlowchart) switchToFlowchart(setActiveTab);
  }, [switchToFlowchart]);

  if (loading)
    return (
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          borderLeft: "1px solid #1A1A28",
          display: "flex",
          flexDirection: "column",
          background: "#0B0B12",
        }}
      >
        <LoadingState />
      </Box>
    );

  if (!result && !showFlowchart)
    return (
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          borderLeft: "1px solid #1A1A28",
          display: "flex",
          flexDirection: "column",
          background: "#0B0B12",
        }}
      >
        <EmptyState />
      </Box>
    );

  const commented = cleanCode(result?.commentedCode || "");
  const elements = result?.elements || [];
  const summary = result?.summary || "";
  const concepts = result?.concepts || [];
  const complexity = result?.complexity || null;

  const tabs = [
    {
      key: "comments",
      label: "AI Comments",
      icon: <AutoAwesomeIcon sx={{ fontSize: 13 }} />,
    },
    {
      key: "flowchart",
      label: "Flowchart",
      icon: <AccountTreeIcon sx={{ fontSize: 13 }} />,
    },
    {
      key: "ask",
      label: "Ask AI",
      icon: <ChatBubbleOutlineIcon sx={{ fontSize: 13 }} />,
    },
  ];

  const LEVEL_STYLES = {
    beginner: {
      color: "#10B981",
      bg: "rgba(16,185,129,0.12)",
      border: "#10B98144",
    },
    intermediate: {
      color: "#8B80FF",
      bg: "rgba(91,79,232,0.12)",
      border: "#5B4FE844",
    },
    expert: {
      color: "#FF7043",
      bg: "rgba(255,112,67,0.12)",
      border: "#FF704344",
    },
  };

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        borderLeft: "1px solid #1A1A28",
        display: "flex",
        flexDirection: "column",
        background: "#0B0B12",
        overflow: "hidden",
      }}
    >
      {/* ── Tab bar ── */}
      <Box
        sx={{
          borderBottom: "1px solid #1A1A28",
          background: "#0A0A10",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isFlowchart = tab.key === "flowchart";
          return (
            <Box
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                px: 2,
                py: 1.2,
                cursor: "pointer",
                position: "relative",
                color: isActive
                  ? isFlowchart
                    ? "#1D9E75"
                    : "#8B80FF"
                  : "#404060",
                borderBottom: isActive
                  ? `2px solid ${isFlowchart ? "#1D9E75" : "#5B4FE8"}`
                  : "2px solid transparent",
                transition: "all 0.15s",
                "&:hover": {
                  color: isFlowchart ? "#1D9E75" : "#8B80FF",
                  background: "rgba(255,255,255,0.02)",
                },
              }}
            >
              {tab.icon}
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "monospace",
                }}
              >
                {tab.label}
              </Typography>
              {/* dot indicator when flowchart is ready */}
              {isFlowchart && (flowchartLoading || flowchartData) && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: flowchartLoading ? "#FFA726" : "#1D9E75",
                    animation: flowchartLoading ? "pulse 1s infinite" : "none",
                    "@keyframes pulse": {
                      "0%,100%": { opacity: 1 },
                      "50%": { opacity: 0.3 },
                    },
                  }}
                />
              )}
            </Box>
          );
        })}

        {/* type badges — only show in comments tab */}
        {activeTab === "comments" && elements.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              alignItems: "center",
              flexWrap: "wrap",
              ml: "auto",
              pr: 1.5,
            }}
          >
            {[...new Set(elements.map((e) => e.type))].map((type) => {
              const s = getTypeStyle(type);
              return (
                <Box
                  key={type}
                  sx={{
                    px: 0.8,
                    py: 0.2,
                    borderRadius: "4px",
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "9px",
                      color: s.text,
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      fontFamily: "monospace",
                    }}
                  >
                    {s.label.toUpperCase()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {activeTab === "comments" && level && (
          <Box sx={{ ml: "auto", pr: 1.5 }}>
            {(() => {
              const ls = LEVEL_STYLES[level] || LEVEL_STYLES.intermediate;
              return (
                <Box
                  sx={{
                    px: 0.8,
                    py: 0.2,
                    borderRadius: "4px",
                    background: ls.bg,
                    border: `1px solid ${ls.border}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "9px",
                      color: ls.color,
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                  >
                    {level.toUpperCase()}
                  </Typography>
                </Box>
              );
            })()}
          </Box>
        )}
      </Box>

      {/* ── COMMENTS TAB ── */}
      {activeTab === "comments" && (
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(91,79,232,0.3)",
              borderRadius: "2px",
            },
          }}
        >
          {!result ? (
            <EmptyState />
          ) : (
            <>
              {/* Summary */}
              {summary && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    background: "#0F0F1A",
                    border: "1px solid rgba(91,79,232,0.2)",
                  }}
                >
                  <SectionLabel
                    icon={
                      <InfoOutlinedIcon
                        sx={{ fontSize: 12, color: "#5B4FE8" }}
                      />
                    }
                    text="Summary"
                  />
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#9090B0",
                      lineHeight: 1.7,
                      fontFamily: "sans-serif",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {summary.replace(/`([^`]+)`/g, "$1")}
                  </Typography>
                </Box>
              )}

              {/* Concepts + Complexity — quick "what am I looking at" glance */}
              {(concepts.length > 0 || complexity) && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {concepts.length > 0 && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "10px",
                        background: "#0F0F1A",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      <SectionLabel
                        icon={<SchoolOutlinedIcon sx={{ fontSize: 12, color: "#10B981" }} />}
                        text="What You'll Learn"
                      />
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                        {concepts.map((c, i) => (
                          <Box
                            key={i}
                            sx={{
                              px: 1,
                              py: 0.4,
                              borderRadius: "6px",
                              background: "rgba(16,185,129,0.1)",
                              border: "1px solid rgba(16,185,129,0.3)",
                            }}
                          >
                            <Typography sx={{ fontSize: "10px", color: "#10B981", fontFamily: "monospace", fontWeight: 600 }}>
                              {c}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {complexity && (complexity.time || complexity.space) && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "10px",
                        background: "#0F0F1A",
                        border: "1px solid rgba(255,167,38,0.2)",
                      }}
                    >
                      <SectionLabel
                        icon={<SpeedOutlinedIcon sx={{ fontSize: 12, color: "#FFA726" }} />}
                        text="Performance"
                      />
                      <Box sx={{ display: "flex", gap: 0.8, mb: complexity.explanation ? 0.8 : 0 }}>
                        {complexity.time && (
                          <Box sx={{ px: 1, py: 0.4, borderRadius: "6px", background: "rgba(255,167,38,0.1)", border: "1px solid rgba(255,167,38,0.3)" }}>
                            <Typography sx={{ fontSize: "10px", color: "#FFA726", fontFamily: "monospace", fontWeight: 700 }}>
                              time {complexity.time}
                            </Typography>
                          </Box>
                        )}
                        {complexity.space && (
                          <Box sx={{ px: 1, py: 0.4, borderRadius: "6px", background: "rgba(255,167,38,0.1)", border: "1px solid rgba(255,167,38,0.3)" }}>
                            <Typography sx={{ fontSize: "10px", color: "#FFA726", fontFamily: "monospace", fontWeight: 700 }}>
                              space {complexity.space}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      {complexity.explanation && (
                        <Typography sx={{ fontSize: "11px", color: "#9090B0", lineHeight: 1.6, fontFamily: "sans-serif" }}>
                          {complexity.explanation}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {/* Elements */}
              {elements.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <SectionLabel
                    icon={<CodeIcon sx={{ fontSize: 12, color: "#5B4FE8" }} />}
                    text={`Code Breakdown — ${elements.length} element${elements.length > 1 ? "s" : ""} (click a card to jump to it)`}
                  />
                  {elements.map((el, i) => {
                    const s = getTypeStyle(el.type);
                    return (
                      <Box
                        key={i}
                        onClick={() => el.lineNumber && onHighlightLine && onHighlightLine(el.lineNumber)}
                        sx={{
                          borderRadius: "8px",
                          background: s.bg,
                          cursor: el.lineNumber ? "pointer" : "default",
                          transition: "transform 0.1s",
                          "&:hover": el.lineNumber ? { transform: "translateX(2px)" } : {},
                          borderLeft: `3px solid ${s.border}`,
                          border: `1px solid ${s.border}22`,
                          borderLeftColor: s.border,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            px: 1.5,
                            pt: 1,
                            pb: 0.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "4px",
                              background: `${s.border}22`,
                              border: `1px solid ${s.border}`,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "9px",
                                color: s.text,
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                                fontFamily: "monospace",
                              }}
                            >
                              {(el.type || "CODE").toUpperCase()}
                            </Typography>
                          </Box>
                          {el.lineNumber && (
                            <Typography
                              sx={{
                                fontSize: "10px",
                                color: "#404060",
                                fontFamily: "monospace",
                              }}
                            >
                              line {el.lineNumber}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            mx: 1.5,
                            mb: 0.8,
                            p: 1,
                            borderRadius: "6px",
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <Typography
                            component="pre"
                            sx={{
                              margin: 0,
                              fontSize: "11px",
                              color: s.text,
                              fontFamily: "'JetBrains Mono', monospace",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                            }}
                          >
                            {el.code}
                          </Typography>
                        </Box>
                        <Box sx={{ px: 1.5, pb: 1.2 }}>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              color: "#9090B0",
                              fontFamily: "sans-serif",
                              lineHeight: 1.6,
                            }}
                          >
                            {el.explanation}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Commented Code */}
              {commented && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <SectionLabel
                      icon={
                        <CodeIcon sx={{ fontSize: 12, color: "#5B4FE8" }} />
                      }
                      text="Commented Code"
                    />
                    <CopyButton text={commented} />
                  </Box>
                  <Box
                    sx={{
                      borderRadius: "10px",
                      background: "#080810",
                      border: "1px solid #1A1A28",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        borderBottom: "1px solid #1A1A28",
                        background: "#0D0D18",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: "5px" }}>
                        {["#FF5F5755", "#FFBD2E55", "#28CA4155"].map((c, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 9,
                              height: 9,
                              borderRadius: "50%",
                              bgcolor: c,
                            }}
                          />
                        ))}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "10px",
                          color: "#303050",
                          fontFamily: "monospace",
                          ml: 0.5,
                        }}
                      >
                        with AI comments
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Typography
                        component="pre"
                        sx={{
                          margin: 0,
                          fontSize: "11px",
                          color: "#9090C0",
                          fontFamily: "'JetBrains Mono', monospace",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.8,
                        }}
                      >
                        {commented.split("\n").map((line, i) => {
                          const isComment =
                            line.trim().startsWith("#") ||
                            line.trim().startsWith("//") ||
                            line.trim().startsWith("*") ||
                            line.trim().startsWith("/*");
                          return (
                            <span
                              key={i}
                              style={{
                                color: isComment ? "#4A6040" : "#9090C0",
                                display: "block",
                              }}
                            >
                              {line || " "}
                            </span>
                          );
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* ── FLOWCHART TAB ── */}
      {activeTab === "flowchart" && (
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 0,
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(29,158,117,0.3)",
              borderRadius: "2px",
            },
          }}
        >
          {!showFlowchart ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                opacity: 0.4,
                p: 4,
                height: "100%",
              }}
            >
              <AccountTreeIcon sx={{ fontSize: 44, color: "#1D9E75" }} />
              <Typography
                sx={{
                  color: "#1D9E75",
                  fontSize: "13px",
                  textAlign: "center",
                  fontFamily: "sans-serif",
                  maxWidth: 220,
                  lineHeight: 1.6,
                }}
              >
                Click "Generate Flowchart" button in the top bar to visualize
                your code
              </Typography>
            </Box>
          ) : (
            <FlowchartPanel
              flowchartData={flowchartData}
              flowchartLoading={flowchartLoading}
            />
          )}
        </Box>
      )}

      {/* ── ASK AI TAB ── */}
      {activeTab === "ask" && (
        <AskPanel code={code} language={language} level={level} hasResult={!!result} />
      )}
    </Box>
  );
}
