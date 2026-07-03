// Builds a shareable Markdown report from the current explanation state
// and triggers a browser download — no backend round trip needed.

export function buildReportMarkdown({ language, level, result, flowchartData }) {
  const lines = [];
  lines.push(`# Codexi.io — Code Explanation Report`);
  lines.push("");
  lines.push(`**Language:** ${language}  `);
  lines.push(`**Explanation level:** ${level}  `);
  lines.push(`**Generated:** ${new Date().toLocaleString()}`);
  lines.push("");

  if (result?.summary) {
    lines.push("## Summary");
    lines.push(result.summary.trim());
    lines.push("");
  }

  if (result?.concepts?.length) {
    lines.push("## Concepts Used");
    lines.push(result.concepts.map((c) => `- ${c}`).join("\n"));
    lines.push("");
  }

  if (result?.complexity) {
    lines.push("## Complexity");
    lines.push(`- **Time:** ${result.complexity.time || "n/a"}`);
    lines.push(`- **Space:** ${result.complexity.space || "n/a"}`);
    if (result.complexity.explanation) {
      lines.push(`- ${result.complexity.explanation}`);
    }
    lines.push("");
  }

  if (result?.elements?.length) {
    lines.push("## Code Breakdown");
    result.elements.forEach((el) => {
      lines.push(`### ${el.type || "CODE"}${el.lineNumber ? ` (line ${el.lineNumber})` : ""}`);
      lines.push("```" + language);
      lines.push(el.code || "");
      lines.push("```");
      lines.push(el.explanation || "");
      lines.push("");
    });
  }

  if (result?.commentedCode) {
    lines.push("## Commented Code");
    lines.push("```" + language);
    lines.push(result.commentedCode.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim());
    lines.push("```");
    lines.push("");
  }

  if (flowchartData) {
    lines.push("## Flowchart (Mermaid)");
    lines.push("```mermaid");
    lines.push(flowchartData.trim());
    lines.push("```");
    lines.push("");
  }

  lines.push("---");
  lines.push("_Generated with Codexi.io — AI Code Explainer_");

  return lines.join("\n");
}

export function downloadReport(markdown, filename = "codexi-report.md") {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
