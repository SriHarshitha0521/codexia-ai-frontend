import { useState, useEffect, useRef } from "react";
import { Box, Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import Editor from "@monaco-editor/react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import axios from "axios";
import { ENDPOINTS } from "../config";

// Skip AI hover lookups for common keywords/punctuation — saves calls to the
// (often slow, local) Ollama model for words that don't need an explanation.
const HOVER_STOPWORDS = new Set([
  "the", "a", "an", "if", "else", "for", "while", "return", "true", "false",
  "null", "void", "public", "private", "static", "class", "import", "from",
  "int", "var", "let", "const", "def", "function", "new", "this", "self",
]);

// Simple in-memory cache so hovering the same word twice is instant.
const hoverCache = new Map();

const DEFAULT_CODE = {
  java: `// Codexi.io — Java
public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int sum = a + b;
        System.out.println("Sum: " + sum);
    }
}`,

  python: `# Codexi.io — Python
def add(a, b):
    return a + b

def greet(name):
    print(f"Hello, {name}!")

result = add(5, 10)
greet("Codexi")
print("Result:", result)`,

  javascript: `// Codexi.io — JavaScript
function add(a, b) {
    return a + b;
}

function greet(name) {
    console.log(\`Hello, \${name}!\`);
}

const result = add(5, 10);
greet("Codexi");
console.log("Result:", result);`,

  typescript: `// Codexi.io — TypeScript
function add(a: number, b: number): number {
    return a + b;
}

function greet(name: string): void {
    console.log(\`Hello, \${name}!\`);
}

const result: number = add(5, 10);
greet("Codexi");
console.log("Result:", result);`,

  react: `// Codexi.io — React
import React, { useState } from "react";

function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <h2>Count: {count}</h2>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}

export default Counter;`,

  node: `// Codexi.io — Node.js
const http = require("http");

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello from Codexi Node Server!");
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});`,

  django: `# Codexi.io — Django
from django.db import models
from django.http import HttpResponse
from django.views import View

class Product(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name

class ProductView(View):
    def get(self, request):
        products = Product.objects.all()
        return HttpResponse(f"Total products: {products.count()}")`,

  cpp: `// Codexi.io — C++
#include <iostream>
using namespace std;

int add(int a, int b) {
    return a + b;
}

void greet(string name) {
    cout << "Hello, " << name << "!" << endl;
}

int main() {
    int result = add(5, 10);
    greet("Codexi");
    cout << "Result: " << result << endl;
    return 0;
}`,

  c: `// Codexi.io — C
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

void greet(char name[]) {
    printf("Hello, %s!\\n", name);
}

int main() {
    int result = add(5, 10);
    greet("Codexi");
    printf("Result: %d\\n", result);
    return 0;
}`,

  go: `// Codexi.io — Go
package main

import "fmt"

func add(a int, b int) int {
    return a + b
}

func greet(name string) {
    fmt.Printf("Hello, %s!\\n", name)
}

func main() {
    result := add(5, 10)
    greet("Codexi")
    fmt.Println("Result:", result)
}`,

  rust: `// Codexi.io — Rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let result = add(5, 10);
    greet("Codexi");
    println!("Result: {}", result);
}`,

  php: `<?php
// Codexi.io — PHP

function add(int $a, int $b): int {
    return $a + $b;
}

function greet(string $name): void {
    echo "Hello, " . $name . "!\\n";
}

$result = add(5, 10);
greet("Codexi");
echo "Result: " . $result . "\\n";
?>`,
};

const getFileName = (lang) => {
  const map = {
    cpp: "main.cpp", javascript: "main.js", python: "main.py",
    typescript: "main.ts", go: "main.go", rust: "main.rs",
    php: "main.php", c: "main.c", node: "server.js",
    react: "App.jsx", django: "views.py",
  };
  return map[lang] || "Main.java";
};

const getMonacoLang = (lang) => {
  const map = {
    cpp: "cpp", node: "javascript", react: "javascript",
    django: "python", c: "c",
  };
  return map[lang] || lang;
};

function buildHoverResult(monaco, word, data) {
  if (!data || !data.explanation) return null;
  const typeLine = data.type
    ? `**${data.type}**${data.dataType && data.dataType !== "unknown" ? ` · \`${data.dataType}\`` : ""}`
    : "";
  return {
    range: new monaco.Range(1, word.startColumn, 1e9, word.endColumn),
    contents: [
      { value: typeLine || "**explanation**" },
      { value: data.explanation },
    ],
  };
}

const EditorPanel = ({ language, level, onResult, loading, setLoading, onCodeChange, highlightLine, externalCode }) => {
  const [codeMap, setCodeMap] = useState({ ...DEFAULT_CODE });
  const [error, setError] = useState(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);

  // current code for selected language
  const code = codeMap[language] || DEFAULT_CODE[language] || "";

  // sync code to App.jsx when language switches
  useEffect(() => {
    if (onCodeChange) onCodeChange(code);
  }, [language]); // eslint-disable-line

  // allow App-level state (e.g. restoring from history) to push code back in
  useEffect(() => {
    if (externalCode != null && externalCode !== code) {
      setCodeMap((prev) => ({ ...prev, [language]: externalCode }));
    }
  }, [externalCode]); // eslint-disable-line

  // highlight the line matching whichever "code breakdown" card the user clicked
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!highlightLine) {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
      return;
    }
    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
      {
        range: new monaco.Range(highlightLine, 1, highlightLine, 1),
        options: {
          isWholeLine: true,
          className: "codexi-highlight-line",
          linesDecorationsClassName: "codexi-highlight-gutter",
        },
      },
    ]);
    editor.revealLineInCenter(highlightLine);
  }, [highlightLine]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // inject the highlight style once
    if (!document.getElementById("codexi-highlight-style")) {
      const style = document.createElement("style");
      style.id = "codexi-highlight-style";
      style.innerHTML = `
        .codexi-highlight-line { background: rgba(91,79,232,0.18); }
        .codexi-highlight-gutter { background: #5B4FE8; width: 3px !important; margin-left: 3px; }
      `;
      document.head.appendChild(style);
    }

    // AI hover tooltip — beginner-friendly "hover any word to understand it"
    monaco.languages.registerHoverProvider(getMonacoLang(language), {
      provideHover: async (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        const token = word.word;
        if (!token || token.length < 2 || /^\d+$/.test(token)) return null;
        if (HOVER_STOPWORDS.has(token.toLowerCase())) return null;

        const cacheKey = `${language}:${token}:${position.lineNumber}`;
        if (hoverCache.has(cacheKey)) {
          return buildHoverResult(monaco, word, hoverCache.get(cacheKey));
        }

        try {
          const res = await axios.post(
            ENDPOINTS.hover,
            {
              word: token,
              lineno: position.lineNumber,
              wordno: position.column,
              fullCode: model.getValue(),
            },
            { timeout: 8000 }
          );
          hoverCache.set(cacheKey, res.data);
          return buildHoverResult(monaco, word, res.data);
        } catch (e) {
          return null; // fail silently — hover is a nice-to-have, not critical
        }
      },
    });
  };

  const handleExplain = async () => {
    if (!code.trim()) return;
    setLoading(true);
    onResult(null);
    try {
      const res = await axios.post(ENDPOINTS.explain, {
        code: code,
        language: language,
        generateFlowchart: false,
        level: level,
      });
      onResult(res.data);
    } catch (e) {
      setError("Could not reach backend. Make sure Spring Boot is running.");
      onResult(null);
    }
    setLoading(false);
  }

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#0D0D14" }}>
      {/* Toolbar */}
      <Box sx={{
        height: "52px", display: "flex", justifyContent: "space-between",
        alignItems: "center", px: "16px", background: "#0A0A10",
        borderBottom: "1px solid #1A1A28"
      }}>
        <Box sx={{ display: "flex", gap: "6px" }}>
          {["#FF5F57", "#FFBD2E", "#28CA41"].map((c, i) => (
            <Box key={i} sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: c, opacity: 0.8 }} />
          ))}
          <Box sx={{
            ml: 1.5, background: "#13131C", border: "1px solid #1E1E2E",
            borderRadius: "5px", px: 1.5, py: 0.3,
            fontSize: "11px", color: "#505070", fontFamily: "monospace"
          }}>
            {getFileName(language)}
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={handleExplain}
          disabled={loading}
          startIcon={loading
            ? <CircularProgress size={14} color="inherit" />
            : <AutoAwesomeIcon sx={{ fontSize: "15px !important" }} />}
          sx={{
            background: "#5B4FE8", textTransform: "none", fontWeight: 600,
            fontSize: "12px", px: 2.5, py: 0.8, borderRadius: "8px",
            fontFamily: "'JetBrains Mono', monospace",
            "&:hover": { background: "#7B6FF8" },
            "&:disabled": { background: "rgba(91,79,232,0.3)", color: "rgba(255,255,255,0.4)" }
          }}
        >
          {loading ? "Explaining..." : "Explain Code"}
        </Button>
      </Box>

      {/* Monaco Editor */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Editor
          height="100%"
          language={getMonacoLang(language)}
          theme="vs-dark"
          value={code}
          onMount={handleEditorMount}
          onChange={(val) => {
            setCodeMap((prev) => ({ ...prev, [language]: val || "" }));
            if (onCodeChange) onCodeChange(val || "");
          }}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "line",
            padding: { top: 16, bottom: 16 },
            cursorBlinking: "smooth",
            smoothScrolling: true,
            contextmenu: false,
            folding: true,
          }}
        />
      </Box>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ fontSize: "12px" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditorPanel;
