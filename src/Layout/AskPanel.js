import { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField, IconButton, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import axios from "axios";
import { ENDPOINTS } from "../config";

const SUGGESTIONS = [
  "Why is this written this way?",
  "What would happen if the input was empty?",
  "Can this be made faster?",
  "Explain this like I'm 5",
];

export default function AskPanel({ code, language, level, hasResult }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (question) => {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await axios.post(ENDPOINTS.ask, { code, language, level, question: q });
      setMessages((m) => [...m, { role: "ai", text: res.data.answer || "" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Couldn't reach the AI backend. Make sure Spring Boot is running.", error: true },
      ]);
    }
    setLoading(false);
  };

  if (!hasResult && messages.length === 0) {
    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 2, opacity: 0.4, p: 4, height: "100%" }}>
        <ChatBubbleOutlineIcon sx={{ fontSize: 44, color: "#8B80FF" }} />
        <Typography sx={{ color: "#8B80FF", fontSize: "13px", textAlign: "center",
          fontFamily: "sans-serif", maxWidth: 220, lineHeight: 1.6 }}>
          Run "Explain Code" first, then ask follow-up questions about it here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ flex: 1, overflow: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1.2,
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { background: "rgba(91,79,232,0.3)", borderRadius: "2px" } }}>

        {messages.length === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}>
            <Typography sx={{ fontSize: "11px", color: "#505070", fontFamily: "monospace",
              textTransform: "uppercase", letterSpacing: "1px", mb: 0.5 }}>
              Try asking
            </Typography>
            {SUGGESTIONS.map((s) => (
              <Box key={s} onClick={() => send(s)} sx={{
                px: 1.5, py: 1, borderRadius: "8px", background: "#0F0F1A",
                border: "1px solid rgba(139,128,255,0.2)", cursor: "pointer",
                fontSize: "12px", color: "#9090C0", fontFamily: "sans-serif",
                "&:hover": { borderColor: "#8B80FF", color: "#C0C0F0" },
              }}>
                {s}
              </Box>
            ))}
          </Box>
        )}

        {messages.map((m, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start",
            flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
            <Box sx={{ width: 24, height: 24, borderRadius: "6px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: m.role === "user" ? "rgba(91,79,232,0.15)" : "rgba(29,158,117,0.15)" }}>
              {m.role === "user"
                ? <PersonOutlineIcon sx={{ fontSize: 14, color: "#8B80FF" }} />
                : <SmartToyOutlinedIcon sx={{ fontSize: 14, color: m.error ? "#EF5350" : "#1D9E75" }} />}
            </Box>
            <Box sx={{
              maxWidth: "82%", px: 1.5, py: 1, borderRadius: "10px",
              background: m.role === "user" ? "rgba(91,79,232,0.1)" : "#0F0F1A",
              border: `1px solid ${m.error ? "rgba(239,83,80,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>
              <Typography sx={{ fontSize: "12px", color: m.error ? "#EF5350" : "#B0B0D0",
                lineHeight: 1.6, fontFamily: "sans-serif", whiteSpace: "pre-wrap" }}>
                {m.text}
              </Typography>
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 4 }}>
            <CircularProgress size={12} sx={{ color: "#1D9E75" }} />
            <Typography sx={{ fontSize: "11px", color: "#5A5A80", fontFamily: "monospace" }}>
              thinking...
            </Typography>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ borderTop: "1px solid #1A1A28", p: 1.2, display: "flex", gap: 1, flexShrink: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask anything about this code..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: "12px", fontFamily: "sans-serif", background: "#0A0A10",
              "& fieldset": { borderColor: "#1E1E2E" },
              "&:hover fieldset": { borderColor: "#5B4FE8" },
              "&.Mui-focused fieldset": { borderColor: "#8B80FF" },
            },
            "& input": { color: "#D0D0F0" },
          }}
        />
        <IconButton onClick={() => send()} disabled={loading || !input.trim()}
          sx={{ background: "#5B4FE8", color: "#fff", borderRadius: "8px", width: 36, height: 36,
            "&:hover": { background: "#7B6FF8" },
            "&.Mui-disabled": { background: "rgba(91,79,232,0.2)", color: "rgba(255,255,255,0.3)" } }}>
          <SendIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
