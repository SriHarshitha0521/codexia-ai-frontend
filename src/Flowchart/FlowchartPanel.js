import { useEffect, useRef, useState } from "react";
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  themeVariables: {
    primaryColor: "#5B4FE8",
    primaryTextColor: "#E0E0F0",
    primaryBorderColor: "#7B6FF8",
    lineColor: "#4ECDC4",
    secondaryColor: "#1D9E75",
    tertiaryColor: "#FF7043",
    background: "#0D0D14",
    mainBkg: "#1A1040",
    nodeBorder: "#7B6FF8",
    clusterBkg: "#0F0F1A",
    titleColor: "#E0E0F0",
    edgeLabelBackground: "#0D0D14",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "14px",
    // decision diamond
    fillType0: "#1A1040",
    fillType1: "#0F2A1A",
    fillType2: "#2A0F10",
    fillType3: "#1A1A00",
    fillType4: "#001A1A",
    fillType5: "#1A000F",
  },
});

function cleanMermaid(raw) {
  if (!raw) return "";
  let text = raw;

  text = text.replace(/```mermaid\s*/gi, "").replace(/```\s*/g, "");
  text = text.replace(/\\n/g, "\n").replace(/\\t/g, "  ");
  text = text.trim();

  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1);
  }

  text = text
    .replace(/^flowchart\s+TD/im, "graph TD")
    .replace(/^flowchart\s+LR/im, "graph LR")
    .replace(/^flowchart\s+TB/im, "graph TD");

  const lines = text.split("\n");
  const graphStart = lines.findIndex((l) =>
    /^graph\s+(TD|LR|RL|BT|TB)/i.test(l.trim())
  );
  let workingLines = graphStart >= 0 ? lines.slice(graphStart) : lines;

  // KEY FIX: cut trailing explanation text after last node bracket
  workingLines = workingLines.map((line) => {
    const arrowMatch = line.match(
      /^(\s*[A-Za-z0-9_]+\s*-->?\|?[^|]*\|?\s*[A-Za-z0-9_]*(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))?)/
    );
    if (arrowMatch) return arrowMatch[1];
    if (/^\s*(graph\s+|subgraph\s+|end\s*$)/i.test(line)) return line;
    if (/^\s*[A-Za-z0-9_]+(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/.test(line)) {
      const m = line.match(/^\s*[A-Za-z0-9_]+(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/);
      return m ? m[0] : null;
    }
    return null;
  }).filter(Boolean);

  let result = workingLines.join("\n");

  // fix labels
  result = result.replace(/\[([^\]]*)\]/g, (_, inner) => {
    let f = inner.replace(/[()]/g,"").replace(/:/g," -")
      .replace(/"/g,"").replace(/[{}]/g,"").replace(/[<>]/g,"")
      .replace(/\s+/g," ").trim();
    if (f.length > 30) f = f.substring(0, 28) + "..";
    return "[" + f + "]";
  });

  result = result.replace(/\{([^}]*)\}/g, (_, inner) => {
    let f = inner.replace(/[()[\]]/g,"").replace(/:/g," -")
      .replace(/"/g,"").replace(/[<>]/g,"").replace(/\s+/g," ").trim();
    if (f.length > 30) f = f.substring(0, 28) + "..";
    return "{" + f + "}";
  });

  if (!/^graph\s+(TD|LR)/im.test(result)) {
    result = "graph TD\n" + result;
  }

  result = result.split("\n").filter((l) => l.trim() !== "").join("\n");
  return result.trim();
}

// Extracts [id, label] pairs in source order for the step-by-step walkthrough.
function parseNodesInOrder(cleanText) {
  if (!cleanText) return [];
  const seen = new Set();
  const nodes = [];
  const re = /([A-Za-z0-9_]+)\s*(\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/g;
  let m;
  while ((m = re.exec(cleanText)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const raw = m[2].slice(1, -1);
    nodes.push({ id, label: raw });
  }
  return nodes;
}

export default function FlowchartPanel({ flowchartData, flowchartLoading }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!flowchartData || !ref.current) return;
    setError(null);
    setPlaying(false);
    setStep(0);

    const render = async () => {
      try {
        const clean = cleanMermaid(flowchartData);
        console.log("=== Cleaned Mermaid ===\n" + clean);
        const uid = "mermaid-" + Date.now() + "-" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(uid, clean);
        if (ref.current) ref.current.innerHTML = svg;
        setError(null);
        setNodes(parseNodesInOrder(clean));
      } catch (e) {
        console.error("Mermaid error:", e);
        setError(e.message || "Syntax error");
        setNodes([]);
      }
    };

    render();
  }, [flowchartData]);

  // dim every node except the active step so users can "trace" execution
  useEffect(() => {
    if (!ref.current || nodes.length === 0) return;
    const nodeEls = ref.current.querySelectorAll(".node");
    nodeEls.forEach((el, i) => {
      el.style.transition = "opacity 0.2s, filter 0.2s";
      el.style.opacity = i === step ? "1" : "0.25";
      el.style.filter = i === step ? "drop-shadow(0 0 6px #5B4FE8)" : "none";
    });
  }, [step, nodes]);

  // auto-advance while playing
  useEffect(() => {
    if (!playing || nodes.length === 0) return;
    if (step >= nodes.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, nodes.length - 1)), 1400);
    return () => clearTimeout(t);
  }, [playing, step, nodes.length]);

  if (flowchartLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center",
        gap: 1.5, p: 4, height: "100%" }}>
        <CircularProgress size={20} sx={{ color: "#1D9E75" }} />
        <Typography sx={{ fontSize: "13px", color: "#1D9E75", fontFamily: "monospace" }}>
          Generating flowchart...
        </Typography>
      </Box>
    );
  }

  if (!flowchartData) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 2, opacity: 0.4, p: 4, height: "100%" }}>
        <AccountTreeIcon sx={{ fontSize: 44, color: "#1D9E75" }} />
        <Typography sx={{ fontSize: "12px", color: "#1D9E75", fontFamily: "monospace" }}>
          Flowchart will appear here...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 2, py: 1.2, borderBottom: "1px solid #1A1A28", background: "#0A0A10",
        flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountTreeIcon sx={{ fontSize: 14, color: "#1D9E75" }} />
          <Typography sx={{ fontSize: "11px", color: "#1D9E75", fontWeight: 700,
            fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "1px" }}>
            Code Flowchart
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Color legend */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {[
              { color: "#5B4FE8", label: "Method" },
              { color: "#1D9E75", label: "Process" },
              { color: "#FFA726", label: "Decision" },
              { color: "#EF5350", label: "End" },
            ].map((item) => (
              <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "2px", background: item.color }} />
                <Typography sx={{ fontSize: "9px", color: "#404060", fontFamily: "monospace" }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography onClick={() => setShowRaw((p) => !p)}
            sx={{ fontSize: "10px", color: "#404060", cursor: "pointer",
              fontFamily: "monospace", textDecoration: "underline",
              "&:hover": { color: "#8080A0" } }}>
            {showRaw ? "hide raw" : "show raw"}
          </Typography>
        </Box>
      </Box>

      {/* Step-by-step walkthrough — great for beginners tracing execution order */}
      {nodes.length > 0 && !error && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1,
          borderBottom: "1px solid #1A1A28", background: "#08080F", flexShrink: 0 }}>
          <IconButton size="small" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }}
            disabled={step === 0} sx={{ color: "#8B80FF", "&.Mui-disabled": { color: "#303050" } }}>
            <SkipPreviousIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={() => setPlaying((p) => !p)}
            sx={{ color: "#1D9E75", background: "rgba(29,158,117,0.1)",
              "&:hover": { background: "rgba(29,158,117,0.2)" } }}>
            {playing ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
          </IconButton>
          <IconButton size="small"
            onClick={() => { setPlaying(false); setStep((s) => Math.min(nodes.length - 1, s + 1)); }}
            disabled={step >= nodes.length - 1} sx={{ color: "#8B80FF", "&.Mui-disabled": { color: "#303050" } }}>
            <SkipNextIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={() => { setPlaying(false); setStep(0); }}
            sx={{ color: "#605080" }}>
            <RestartAltIcon sx={{ fontSize: 14 }} />
          </IconButton>

          <Typography sx={{ fontSize: "10px", color: "#404060", fontFamily: "monospace", ml: 0.5 }}>
            step {step + 1}/{nodes.length}
          </Typography>

          <Box sx={{ flex: 1, mx: 1.5, px: 1.5, py: 0.5, borderRadius: "6px",
            background: "rgba(91,79,232,0.08)", border: "1px solid rgba(91,79,232,0.25)",
            overflow: "hidden" }}>
            <Typography sx={{ fontSize: "11px", color: "#B0B0F0", fontFamily: "monospace",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {nodes[step]?.label || ""}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Scrollable chart area */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2,
        "&::-webkit-scrollbar": { width: "4px", height: "4px" },
        "&::-webkit-scrollbar-thumb": { background: "rgba(29,158,117,0.3)", borderRadius: "2px" }
      }}>

        {/* Raw view */}
        {showRaw && (
          <Box sx={{ mb: 2, p: 1.5, borderRadius: "8px",
            background: "#050508", border: "1px solid #1A1A28" }}>
            <Typography component="pre" sx={{ margin: 0, fontSize: "10px",
              color: "#5050A0", fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {cleanMermaid(flowchartData)}
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box sx={{ mb: 2, p: 1.5, borderRadius: "8px",
            background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.3)" }}>
            <Typography sx={{ fontSize: "11px", color: "#EF5350",
              fontFamily: "monospace", mb: 0.5 }}>
              Mermaid syntax error — click "show raw" to inspect
            </Typography>
            <Typography sx={{ fontSize: "10px", color: "#804040", fontFamily: "monospace" }}>
              {error}
            </Typography>
          </Box>
        )}

        {/* Diagram — full size, scrollable */}
        {!error && (
          <Box sx={{
            background: "#080810",
            border: "1px solid #1A1A28",
            borderRadius: "10px",
            p: 3,
            minWidth: "fit-content",
            "& svg": {
              width: "100%",
              height: "auto",
              minWidth: "400px",
            },
            // colorful node styles injected via CSS
            "& .node rect, & .node circle, & .node ellipse, & .node polygon": {
              strokeWidth: "2px !important",
            },
            "& .node:nth-of-type(1) rect": { fill: "#1A1040 !important", stroke: "#5B4FE8 !important" },
            "& .node:nth-of-type(2) rect": { fill: "#0F2A1A !important", stroke: "#1D9E75 !important" },
            "& .node:nth-of-type(3) rect": { fill: "#2A1500 !important", stroke: "#FFA726 !important" },
            "& .node:nth-of-type(4) rect": { fill: "#2A0F0F !important", stroke: "#EF5350 !important" },
            "& .node:nth-of-type(5) rect": { fill: "#001A1A !important", stroke: "#29B6F6 !important" },
            "& .node:nth-of-type(6) rect": { fill: "#1A1040 !important", stroke: "#AB47BC !important" },
            "& .edgePath path": { stroke: "#4ECDC4 !important", strokeWidth: "1.5px !important" },
            "& .edgeLabel": { background: "#0D0D14 !important", color: "#8080A0 !important" },
            "& .label": { color: "#E0E0F0 !important" },
          }}>
            <div ref={ref} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
