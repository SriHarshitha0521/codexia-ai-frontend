import { Box, Tooltip } from "@mui/material";
import { FaJava, FaPython, FaJs, FaReact, FaNodeJs, FaPhp } from "react-icons/fa";
import { SiDjango, SiTypescript, SiCplusplus, SiGo, SiC, SiRust } from "react-icons/si";

const languages = [
  { name: "java",       icon: <FaJava />,       color: "#f89820", label: "Java"       },
  { name: "python",     icon: <FaPython />,     color: "#3776AB", label: "Python"     },
  { name: "javascript", icon: <FaJs />,         color: "#f7df1e", label: "JavaScript" },
  { name: "react",      icon: <FaReact />,      color: "#61dafb", label: "React/JSX"  },
  { name: "node",       icon: <FaNodeJs />,     color: "#3c873a", label: "Node.js"    },
  { name: "django",     icon: <SiDjango />,     color: "#44B78B", label: "Django"     },
  { name: "typescript", icon: <SiTypescript />, color: "#3178c6", label: "TypeScript" },
  { name: "cpp",        icon: <SiCplusplus />,  color: "#00599c", label: "C++"        },
  { name: "c",          icon: <SiC />,          color: "#A8B9CC", label: "C"          },
  { name: "go",         icon: <SiGo />,         color: "#00ADD8", label: "Go"         },
  { name: "rust",       icon: <SiRust />,       color: "#DEA584", label: "Rust"       },
  { name: "php",        icon: <FaPhp />,        color: "#777BB4", label: "PHP"        },
];

const Sidebar = ({ language, setLanguage }) => {
  return (
    <Box sx={{
      width: "64px",
      height: "calc(100vh - 64px)",
      background: "#080810",
      borderRight: "1px solid #1A1A28",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      pt: "20px",
      gap: "6px",
      overflowY: "auto",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    }}>
      {languages.map((lang, index) => {
        const isActive = language === lang.name;
        return (
          <Tooltip title={lang.label} placement="right" key={index}
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "#13131C", border: "1px solid #1E1E2E",
                  color: "#C0C0D8", fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace"
                }
              }
            }}>
            <Box
              onClick={() => setLanguage(lang.name)}
              sx={{
                width: "44px", height: "44px",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "10px", cursor: "pointer",
                fontSize: "22px",
                color: isActive ? lang.color : "#303050",
                background: isActive ? `${lang.color}15` : "transparent",
                border: isActive ? `1px solid ${lang.color}40` : "1px solid transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  color: lang.color,
                  background: `${lang.color}10`,
                  transform: "scale(1.1)",
                }
              }}
            >
              {lang.icon}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default Sidebar;
