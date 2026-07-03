import { Box, Drawer, Typography, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HistoryIcon from "@mui/icons-material/History";
import { clearHistory } from "../utils/history";

const LEVEL_COLORS = { beginner: "#10B981", intermediate: "#8B80FF", expert: "#FF7043" };

export default function HistoryDrawer({ open, onClose, entries, onRestore, onCleared }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 320, background: "#0A0A10", borderLeft: "1px solid #1A1A28" } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        px: 2, py: 1.5, borderBottom: "1px solid #1A1A28" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryIcon sx={{ fontSize: 16, color: "#8B80FF" }} />
          <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#E0E0F0",
            fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "1px" }}>
            Recent Sessions
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#606080" }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 1.2, display: "flex", flexDirection: "column", gap: 1 }}>
        {entries.length === 0 && (
          <Typography sx={{ fontSize: "12px", color: "#404060", fontFamily: "sans-serif",
            textAlign: "center", mt: 4 }}>
            Nothing explained yet. Run "Explain Code" to start building your history.
          </Typography>
        )}

        {entries.map((entry) => (
          <Box key={entry.id} onClick={() => onRestore(entry)} sx={{
            p: 1.2, borderRadius: "8px", background: "#0F0F1A",
            border: "1px solid #1A1A28", cursor: "pointer",
            "&:hover": { borderColor: "#5B4FE8" },
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.6 }}>
              <Box sx={{ px: 0.7, py: 0.15, borderRadius: "4px", background: "#13131C",
                border: "1px solid #1E1E2E" }}>
                <Typography sx={{ fontSize: "9px", color: "#8080A0", fontFamily: "monospace" }}>
                  {entry.language}
                </Typography>
              </Box>
              <Box sx={{ px: 0.7, py: 0.15, borderRadius: "4px",
                background: `${LEVEL_COLORS[entry.level] || "#8B80FF"}18`,
                border: `1px solid ${LEVEL_COLORS[entry.level] || "#8B80FF"}44` }}>
                <Typography sx={{ fontSize: "9px", color: LEVEL_COLORS[entry.level] || "#8B80FF",
                  fontFamily: "monospace", fontWeight: 700 }}>
                  {entry.level}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "9px", color: "#404060", ml: "auto", fontFamily: "monospace" }}>
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "11px", color: "#8080A0", fontFamily: "sans-serif",
              lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden" }}>
              {entry.summary || "No summary available."}
            </Typography>
          </Box>
        ))}
      </Box>

      {entries.length > 0 && (
        <Box sx={{ p: 1.2, borderTop: "1px solid #1A1A28" }}>
          <Tooltip title="Clear all history">
            <Box onClick={() => { clearHistory(); onCleared(); }} sx={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8,
              py: 0.8, borderRadius: "8px", cursor: "pointer", color: "#604040",
              "&:hover": { color: "#EF5350", background: "rgba(239,83,80,0.06)" },
            }}>
              <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: "11px", fontFamily: "monospace" }}>Clear history</Typography>
            </Box>
          </Tooltip>
        </Box>
      )}
    </Drawer>
  );
}
