import { useState, useRef } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Badge,
} from "@mui/material";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import DownloadIcon from "@mui/icons-material/Download";
import HistoryIcon from "@mui/icons-material/History";
import Sidebar from "./Layout/Sidebar";
import EditorPanel from "./Layout/EditorPanel";
import OutputPanel from "./Layout/OutputPanel";
import HistoryDrawer from "./Layout/HistoryDrawer";
import { ENDPOINTS } from "./config";
import { getHistory, addHistoryEntry } from "./utils/history";
import { buildReportMarkdown, downloadReport } from "./utils/exportReport";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#5B4FE8" },
    background: { default: "#0D0D14", paper: "#0A0A10" },
    text: { primary: "#E0E0F0", secondary: "#8080A0" },
  },
  typography: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  shape: { borderRadius: 10 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#0A0A10",
          borderBottom: "1px solid #1A1A28",
          boxShadow: "none",
        },
      },
    },
  },
});

export default function App() {
  const [language, setLanguage] = useState("java");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(`// Codexi.io — Java
public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int sum = a + b;
        System.out.println("Sum: " + sum);
    }
}`);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [flowchartLoading, setFlowchartLoading] = useState(false);
  const [flowchartData, setFlowchartData] = useState(null);
  const [level, setLevel] = useState("beginner");

  // line number to highlight in the editor (set when a "code breakdown" card is clicked)
  const [highlightLine, setHighlightLine] = useState(null);

  // code pushed in from outside the editor (e.g. restoring a history entry)
  const [externalCode, setExternalCode] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState(() => getHistory());
  const [toast, setToast] = useState(null);

  // ref to let App tell ResultPanel to switch tab
  const switchTabRef = useRef(null);
  const switchToFlowchart = (fn) => {
    switchTabRef.current = fn;
  };

  const handleResult = (data) => {
    setResult(data);
    setHighlightLine(null);
    if (data) {
      const updated = addHistoryEntry({ code, language, level, summary: data.summary });
      setHistoryEntries(updated);
    }
  };

  const handleGenerateFlowchart = async () => {
    setShowFlowchart(true);
    setFlowchartLoading(true);
    setFlowchartData(null);
    if (switchTabRef.current) switchTabRef.current("flowchart");
    try {
      const res = await fetch(ENDPOINTS.explain, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, generateFlowchart: true, level }),
      });
      const data = await res.json();
      setFlowchartData(data.flowchart || null);
    } catch (e) {
      setFlowchartData(null);
      setToast({ severity: "error", message: "Could not reach backend. Make sure Spring Boot is running." });
    }
    setFlowchartLoading(false);
  };

  const handleRestoreHistory = (entry) => {
    setLanguage(entry.language);
    setLevel(entry.level);
    setExternalCode(entry.code);
    setCode(entry.code);
    setResult(null);
    setShowFlowchart(false);
    setFlowchartData(null);
    setHistoryOpen(false);
    setToast({ severity: "info", message: "Session restored — click Explain Code to re-run it." });
  };

  const handleExport = () => {
    if (!result) {
      setToast({ severity: "warning", message: "Explain some code first, then export the report." });
      return;
    }
    const md = buildReportMarkdown({ language, level, result, flowchartData: showFlowchart ? flowchartData : null });
    downloadReport(md, `codexi-${language}-report.md`);
  };

  const LEVELS = [
    { key: "beginner", label: "Beginner", color: "#10B981" },
    { key: "intermediate", label: "Intermediate", color: "#8B80FF" },
    { key: "expert", label: "Expert", color: "#FF7043" },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ minHeight: "64px !important", px: 2, gap: 1.5 }}>
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  background: "#5B4FE8",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.5px",
                }}
              >
                Cx
              </Box>
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  fontFamily: "sans-serif",
                  color: "#E0E0F0",
                }}
              >
                code<span style={{ color: "#5B4FE8" }}>xi</span>
                <span
                  style={{
                    color: "#404060",
                    fontSize: "13px",
                    fontWeight: 400,
                  }}
                >
                  .io
                </span>
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Language pill */}
            <Box
              sx={{
                background: "#13131C",
                border: "1px solid #1E1E2E",
                borderRadius: "8px",
                px: 1.5,
                py: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 0.8,
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#5B4FE8",
                }}
              />
              <Typography
                sx={{
                  fontSize: "11px",
                  color: "#7070A0",
                  fontFamily: "monospace",
                }}
              >
                {language}
              </Typography>
            </Box>

            <Box sx={{
              display: "flex",
              background: "#0A0A10",
              border: "1px solid #1A1A28",
              borderRadius: "8px",
              p: "2px",
              gap: "2px",
            }}>
              {LEVELS.map((l) => (
                <Box
                  key={l.key}
                  onClick={() => setLevel(l.key)}
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    letterSpacing: "0.3px",
                    transition: "all 0.15s",
                    color: level === l.key ? l.color : "#303050",
                    background: level === l.key ? `${l.color}18` : "transparent",
                    border: level === l.key
                      ? `1px solid ${l.color}44`
                      : "1px solid transparent",
                    "&:hover": { color: l.color },
                  }}
                >
                  {l.label}
                </Box>
              ))}
            </Box>

            {/* Generate Flowchart button — beside language pill */}
            <Button
              variant="outlined"
              onClick={handleGenerateFlowchart}
              disabled={flowchartLoading}
              startIcon={
                flowchartLoading ? (
                  <CircularProgress size={13} color="inherit" />
                ) : (
                  <AccountTreeIcon sx={{ fontSize: "14px !important" }} />
                )
              }
              sx={{
                borderColor: "#1D9E75",
                color: showFlowchart ? "#4ECDC4" : "#1D9E75",
                background: showFlowchart
                  ? "rgba(29,158,117,0.1)"
                  : "transparent",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "12px",
                px: 2,
                py: 0.7,
                borderRadius: "8px",
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: "#4ECDC4",
                  color: "#4ECDC4",
                  background: "rgba(29,158,117,0.08)",
                },
                "&:disabled": { borderColor: "#1A2A20", color: "#2A4A30" },
              }}
            >
              {flowchartLoading ? "Generating..." : "Generate Flowchart"}
            </Button>

            {/* Export report */}
            <Tooltip title="Download explanation as a Markdown report">
              <span>
                <IconButton
                  onClick={handleExport}
                  disabled={!result}
                  sx={{
                    color: result ? "#8B80FF" : "#303050",
                    border: "1px solid #1A1A28",
                    borderRadius: "8px",
                    width: 34,
                    height: 34,
                    "&:hover": { borderColor: "#8B80FF", background: "rgba(139,128,255,0.08)" },
                  }}
                >
                  <DownloadIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>

            {/* History */}
            <Tooltip title="Recent sessions">
              <IconButton
                onClick={() => setHistoryOpen(true)}
                sx={{
                  color: "#8080A0",
                  border: "1px solid #1A1A28",
                  borderRadius: "8px",
                  width: 34,
                  height: 34,
                  "&:hover": { borderColor: "#8B80FF", color: "#8B80FF" },
                }}
              >
                <Badge badgeContent={historyEntries.length} max={9} color="primary"
                  sx={{ "& .MuiBadge-badge": { fontSize: "8px", height: 14, minWidth: 14 } }}>
                  <HistoryIcon sx={{ fontSize: 16 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* AI thinking indicator */}
            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#10B981",
                    animation: "pulse 1.2s infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.3 },
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#10B981",
                    fontFamily: "monospace",
                  }}
                >
                  AI thinking...
                </Typography>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Sidebar language={language} setLanguage={setLanguage} />
          <EditorPanel
            language={language}
            onResult={handleResult}
            level={level}
            loading={loading}
            setLoading={setLoading}
            onCodeChange={setCode}
            highlightLine={highlightLine}
            externalCode={externalCode}
          />
          <OutputPanel
            result={result}
            loading={loading}
            level={level}
            code={code}
            language={language}
            showFlowchart={showFlowchart}
            flowchartData={flowchartData}
            flowchartLoading={flowchartLoading}
            switchToFlowchart={switchToFlowchart}
            onHighlightLine={setHighlightLine}
          />
        </Box>
      </Box>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={historyEntries}
        onRestore={handleRestoreHistory}
        onCleared={() => setHistoryEntries([])}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ fontSize: "12px" }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ThemeProvider>
  );
}
