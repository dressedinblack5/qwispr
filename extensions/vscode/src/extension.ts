// ponytail: single-file wrap, split if extension grows
import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";
import { execFile } from "node:child_process";

function getCliPath(): string {
  const cfg = vscode.workspace.getConfiguration("qwispr").get<string>("cliPath");
  if (cfg) return cfg;
  // extension dist is extensions/vscode/dist/extension.js -> repo root is 3 levels up
  const fromExt = path.resolve(__dirname, "..", "..", "..", "dist", "src", "cli.js");
  if (fs.existsSync(fromExt)) return fromExt;
  const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (ws) {
    const fromWs = path.join(ws, "dist", "src", "cli.js");
    if (fs.existsSync(fromWs)) return fromWs;
  }
  return fromExt;
}

function runCli(args: string[]): Promise<any> {
  const cli = getCliPath();
  if (!fs.existsSync(cli)) return Promise.reject(new Error(`qwispr CLI not found at ${cli} — run 'npm run build' at repo root`));
  return new Promise((resolve, reject) => {
    execFile("node", [cli, ...args], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try { resolve(JSON.parse(stdout)); } catch { resolve(stdout); }
    });
  });
}

function activeFile(): string | undefined {
  const doc = vscode.window.activeTextEditor?.document;
  if (doc?.uri.fsPath) return doc.uri.fsPath;
  vscode.window.showWarningMessage("Qwispr: no active file");
  return undefined;
}

function analyzeHtml(result: any, file: string): string {
  const hs = (result.hotSpots ?? []).map((h: string) => `<tr><td>${esc(h)}</td><td>${(result.centrality?.[h] ?? 0).toFixed(3)}</td></tr>`).join("") || `<tr><td colspan=2>—</td></tr>`;
  const nodes = (result.nodes ?? []).join(", ") || "—";
  const edges = (result.edges ?? []).map((e: string[]) => `${esc(e[0])} → ${esc(e[1])}`).join(", ") || "—";
  const reach = (result.reachableFromEntry ?? []).join(", ") || "—";
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:var(--vscode-font-family);padding:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid var(--vscode-panel-border);padding:6px 8px;text-align:left}th{background:var(--vscode-editor-inactiveSelectionBackground)}code{font-size:12px}</style></head><body>
<h2>Qwispr Analyze — ${esc(path.basename(file))}</h2>
<p><b>Nodes:</b> <code>${esc(nodes)}</code></p>
<p><b>Edges:</b> <code>${esc(edges)}</code></p>
<p><b>Reachable:</b> <code>${esc(reach)}</code></p>
<p><b>Diameter:</b> ${result.diameter ?? "—"}</p>
<h3>HotSpots (centrality)</h3>
<table><tr><th>Function</th><th>Centrality</th></tr>${hs}</table>
<details style="margin-top:12px"><summary>Raw JSON</summary><pre>${esc(JSON.stringify(result, null, 2))}</pre></details>
</body></html>`;
}
function esc(s: string): string { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("qwispr.analyze", async () => {
      const file = activeFile(); if (!file) return;
      try {
        const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Qwispr: analyzing…" }, () => runCli(["analyze", "--file", file]));
        const panel = vscode.window.createWebviewPanel("qwisprAnalyze", `Qwispr Analyze — ${path.basename(file)}`, vscode.ViewColumn.One, {});
        panel.webview.html = analyzeHtml(result, file);
      } catch (e: any) { vscode.window.showErrorMessage(`Qwispr analyze failed: ${e.message}`); }
    }),
    vscode.commands.registerCommand("qwispr.search", async () => {
      const pattern = await vscode.window.showInputBox({ prompt: "Qwispr search pattern (regex)", placeHolder: "TODO|FIXME" });
      if (!pattern) return;
      const files = await vscode.window.showInputBox({ prompt: "Glob", value: "src/**/*.{ts,js,py}", placeHolder: "src/**/*.ts" });
      if (!files) return;
      try {
        const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Qwispr: searching…" }, () => runCli(["search", "--pattern", pattern, "--files", files, "--top", "20"]));
        const hits: any[] = result.hits ?? [];
        if (hits.length === 0) { vscode.window.showInformationMessage("Qwispr: no hits"); return; }
        const pick = await vscode.window.showQuickPick(hits.map((h: any) => ({ label: `${h.file}:${h.line}`, description: h.snippet, detail: h.file, hit: h })), { placeHolder: `Qwispr: ${hits.length} hits — pick to open` });
        if (pick) {
          const doc = await vscode.workspace.openTextDocument(pick.hit.file);
          const ed = await vscode.window.showTextDocument(doc);
          const pos = new vscode.Position(Math.max(0, pick.hit.line - 1), 0);
          ed.selection = new vscode.Selection(pos, pos);
          ed.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
        }
      } catch (e: any) { vscode.window.showErrorMessage(`Qwispr search failed: ${e.message}`); }
    }),
    vscode.commands.registerCommand("qwispr.testgen", async () => {
      const file = activeFile(); if (!file) return;
      const fn = await vscode.window.showInputBox({ prompt: "Function name to generate tests for", placeHolder: "myFunction" });
      if (!fn) return;
      try {
        const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Qwispr: generating tests…" }, () => runCli(["testgen", "--file", file, "--function", fn]));
        const inputs = result.inputs ?? result;
        const hint = result.coverageHint ?? "";
        const doc = await vscode.workspace.openTextDocument({ language: "json", content: JSON.stringify({ function: fn, file, inputs, coverageHint: hint }, null, 2) });
        await vscode.window.showTextDocument(doc);
        if (hint) vscode.window.showInformationMessage(`Qwispr: ${hint}`);
      } catch (e: any) { vscode.window.showErrorMessage(`Qwispr testgen failed: ${e.message}`); }
    })
  );
}

export function deactivate() {}
