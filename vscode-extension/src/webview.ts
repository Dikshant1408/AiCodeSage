/**
 * Generates the HTML for the AI Results sidebar webview panel.
 */
export function getWebviewHtml(
  title: string,
  content: string,
  isLoading = false,
  isError = false
): string {
  const bodyContent = isLoading
    ? `<div class="loading"><div class="spinner"></div><p>AI is analyzing your code...</p></div>`
    : isError
    ? `<div class="error"><span class="icon">⚠</span><pre>${escapeHtml(content)}</pre></div>`
    : `<div class="result"><pre>${escapeHtml(content)}</pre></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Code Assistant</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, monospace);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 12px;
      line-height: 1.6;
    }
    .header {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 0 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
      margin-bottom: 12px;
    }
    .header .icon { font-size: 1.2rem; }
    .header .title { font-weight: 600; font-size: 0.9rem; color: var(--vscode-foreground); }
    .loading {
      display: flex; flex-direction: column; align-items: center;
      padding: 2rem 0; gap: 1rem; color: var(--vscode-descriptionForeground);
    }
    .spinner {
      width: 28px; height: 28px;
      border: 2px solid var(--vscode-panel-border);
      border-top-color: var(--vscode-focusBorder);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error {
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px; padding: 10px;
    }
    .error .icon { color: var(--vscode-errorForeground); margin-right: 6px; }
    .result pre {
      white-space: pre-wrap; word-break: break-word;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.85rem;
      color: var(--vscode-foreground);
    }
    .empty {
      text-align: center; padding: 2rem;
      color: var(--vscode-descriptionForeground); font-size: 0.85rem;
    }
    .badge {
      display: inline-block; padding: 1px 6px; border-radius: 3px;
      font-size: 0.7rem; font-weight: 600; margin-right: 4px;
    }
    .badge-high   { background: rgba(239,68,68,0.2);  color: #f87171; }
    .badge-medium { background: rgba(245,158,11,0.2); color: #fbbf24; }
    .badge-low    { background: rgba(107,114,128,0.2);color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <span class="icon">🤖</span>
    <span class="title">${escapeHtml(title)}</span>
  </div>
  ${bodyContent}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
