import * as vscode from "vscode";
import { callApi } from "./api";
import { getWebviewHtml } from "./webview";

let resultsPanel: vscode.WebviewPanel | undefined;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getConfig(): { backendUrl: string; language: string } {
  const cfg = vscode.workspace.getConfiguration("aiCodeAssistant");
  return {
    backendUrl: cfg.get<string>("backendUrl") || "http://localhost:8000",
    language:   cfg.get<string>("language")   || "python",
  };
}

function getSelectedOrFullCode(editor: vscode.TextEditor): string {
  const selection = editor.selection;
  if (!selection.isEmpty) {
    return editor.document.getText(selection);
  }
  return editor.document.getText();
}

function getOrCreatePanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
  if (resultsPanel) {
    resultsPanel.reveal(vscode.ViewColumn.Beside);
    return resultsPanel;
  }
  resultsPanel = vscode.window.createWebviewPanel(
    "aiAssistantResults",
    "AI Code Assistant",
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  resultsPanel.onDidDispose(() => { resultsPanel = undefined; }, null, context.subscriptions);
  return resultsPanel;
}

function showLoading(panel: vscode.WebviewPanel, title: string) {
  panel.webview.html = getWebviewHtml(title, "", true);
}

function showResult(panel: vscode.WebviewPanel, title: string, text: string) {
  panel.webview.html = getWebviewHtml(title, text);
}

function showError(panel: vscode.WebviewPanel, title: string, err: string) {
  panel.webview.html = getWebviewHtml(title, err, false, true);
}

function formatReviewResult(data: any): string {
  const lines: string[] = [];
  if (data.quality) {
    const q = data.quality;
    lines.push(`Quality Score: ${q.score}/10  Grade: ${q.grade}`);
    lines.push(`Bugs: ${q.bugs}  Security: ${q.security_issues}  Smells: ${q.code_smells}`);
    if (q.issues?.length) lines.push("\nIssues:\n" + q.issues.map((i: string) => `  • ${i}`).join("\n"));
    lines.push("\n" + "─".repeat(50));
  }
  if (data.ai_review) lines.push("\nAI Review:\n" + data.ai_review);
  if (data.functions_found?.length) {
    lines.push("\nFunctions found: " + data.functions_found.join(", "));
  }
  return lines.join("\n");
}

// ── Command factory ───────────────────────────────────────────────────────────

function makeCommand(
  context: vscode.ExtensionContext,
  title: string,
  endpoint: string,
  buildBody: (code: string, lang: string) => object,
  formatResult: (data: any) => string
) {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("AI Code Assistant: No active editor.");
      return;
    }

    const code = getSelectedOrFullCode(editor);
    if (!code.trim()) {
      vscode.window.showWarningMessage("AI Code Assistant: No code to analyze.");
      return;
    }

    const { backendUrl, language } = getConfig();
    const panel = getOrCreatePanel(context);
    showLoading(panel, title);

    const result = await callApi(backendUrl, endpoint, buildBody(code, language));

    if (!result.success) {
      showError(panel, title, result.error || "Unknown error");
      vscode.window.showErrorMessage(`AI Code Assistant: ${result.error}`);
      return;
    }

    showResult(panel, title, formatResult(result.data));
  };
}

// ── Activate ──────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("AI Code Assistant activated! Use right-click → AI Code Assistant or Ctrl+Shift+R");

  const commands: [string, () => Promise<void>][] = [
    [
      "aiAssistant.reviewCode",
      makeCommand(context, "Code Review", "/api/review/",
        (code, language) => ({ code, language, analyze_functions: true }),
        formatReviewResult
      ),
    ],
    [
      "aiAssistant.detectBugs",
      makeCommand(context, "Bug Detection", "/api/analyze/bugs",
        (code) => ({ code }),
        (d) => d.ai_bugs || JSON.stringify(d, null, 2)
      ),
    ],
    [
      "aiAssistant.explainCode",
      makeCommand(context, "Code Explanation", "/api/explain/",
        (code) => ({ code }),
        (d) => d.explanation || JSON.stringify(d, null, 2)
      ),
    ],
    [
      "aiAssistant.securityScan",
      makeCommand(context, "Security Scan", "/api/security/",
        (code) => ({ code }),
        (d) => [d.ai_security, d.bandit_scan ? "\nBandit:\n" + d.bandit_scan : ""].join("\n")
      ),
    ],
    [
      "aiAssistant.generateTests",
      makeCommand(context, "Test Generator", "/api/tests/",
        (code, language) => ({ code, language }),
        (d) => d.generated_tests || JSON.stringify(d, null, 2)
      ),
    ],
    [
      "aiAssistant.generateDocs",
      makeCommand(context, "Docs Generator", "/api/docs/",
        (code) => ({ code }),
        (d) => d.documentation || JSON.stringify(d, null, 2)
      ),
    ],
    [
      "aiAssistant.autoFix",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const code = getSelectedOrFullCode(editor);
        const issue = await vscode.window.showInputBox({
          prompt: "Describe the issue to fix",
          placeHolder: "e.g. Unused variable on line 5, SQL injection risk...",
        });
        if (!issue) return;
        const { backendUrl } = getConfig();
        const panel = getOrCreatePanel(context);
        showLoading(panel, "AI Auto-Fix");
        const result = await callApi(backendUrl, "/api/advanced/autofix", { code, issue });
        if (!result.success) { showError(panel, "AI Auto-Fix", result.error!); return; }
        showResult(panel, "AI Auto-Fix", `Issue: ${result.data.original_issue}\n\n${result.data.fix}`);
      },
    ],
    [
      "aiAssistant.debugError",
      async () => {
        const editor = vscode.window.activeTextEditor;
        const code = editor ? getSelectedOrFullCode(editor) : "";
        const error = await vscode.window.showInputBox({
          prompt: "Paste the error message or traceback",
          placeHolder: "TypeError: 'NoneType' object is not iterable",
        });
        if (!error) return;
        const { backendUrl } = getConfig();
        const panel = getOrCreatePanel(context);
        showLoading(panel, "AI Debugger");
        const result = await callApi(backendUrl, "/api/advanced/debug", { error, code });
        if (!result.success) { showError(panel, "AI Debugger", result.error!); return; }
        showResult(panel, "AI Debugger", result.data.explanation || JSON.stringify(result.data, null, 2));
      },
    ],
    [
      "aiAssistant.openDashboard",
      async () => {
        const { backendUrl } = getConfig();
        const dashboardUrl = backendUrl.replace(":8000", ":3001");
        vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
      },
    ],
  ];

  for (const [id, handler] of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));
  }

  // Status bar button
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = "$(robot) AI Assist";
  statusBar.tooltip = "AI Code Assistant — Click to review current file";
  statusBar.command = "aiAssistant.reviewCode";
  statusBar.show();
  context.subscriptions.push(statusBar);
}

export function deactivate() {
  resultsPanel?.dispose();
}
