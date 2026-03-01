import * as vscode from 'vscode';
import * as https from 'https';

export function activate(context: vscode.ExtensionContext) {

    const disposable = vscode.commands.registerCommand('neurolint.analyze', async () => {

        const initialEditor = vscode.window.activeTextEditor;

        if (!initialEditor) {
            vscode.window.showErrorMessage("Open a file and select code first.");
            return;
        }

        const initialDocument = initialEditor.document;

        const panel = vscode.window.createWebviewPanel(
            'neurolintPanel',
            '🧠 NeuroLint',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message) => {

            if (message.command !== 'analyze') return;

            const editor = vscode.window.visibleTextEditors.find(
                e => e.document === initialDocument
            );

            if (!editor) {
                panel.webview.postMessage({
                    command: "error",
                    message: "Original file is no longer open."
                });
                return;
            }

            const selectedText = editor.document.getText(editor.selection);

            if (!selectedText) {
                panel.webview.postMessage({
                    command: "error",
                    message: "Please select some code first."
                });
                return;
            }

            const requestBody = JSON.stringify({
                code: selectedText,
                mode: message.mode,
                therapist: message.cognitive
            });

            const options = {
                hostname: "neurolint-gdc2bbchceaudagp.centralindia-01.azurewebsites.net",
                path: "/analyze",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(requestBody)
                }
            };

            try {
                const apiResponse = await new Promise<string>((resolve, reject) => {

                    const req = https.request(options, (res) => {
                        let data = "";

                        res.on("data", chunk => data += chunk);
                        res.on("end", () => resolve(data));
                    });

                    req.on("error", reject);
                    req.write(requestBody);
                    req.end();
                });

                console.log("RAW RESPONSE:");
                console.log(apiResponse);


                const structured = JSON.parse(apiResponse);

                panel.webview.postMessage({
                    command: "result",
                    data: structured
                });

            } catch (err: any) {
                panel.webview.postMessage({
                    command: "error",
                    message: String(err)
                });
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

/* =========================
   ROOT THEME VARIABLES
========================= */

:root {
    --bg-main: linear-gradient(135deg, #0b0f19, #020617);
    --bg-panel: rgba(17, 24, 39, 0.85);
    --border: rgba(30, 58, 138, 0.4);

    --text-main: #e5e7eb;
    --text-muted: #94a3b8;

    --accent-primary: #60a5fa;
    --accent-secondary: #facc15;

    --button-bg: rgba(17,24,39,0.8);
    --button-hover: #1e3a8a;

    --glow: rgba(96,165,250,0.4);
}

/* DARK NIGHT */
body.dark-night {
    --bg-main: linear-gradient(135deg,#000000 0%,#020617 30%,#0c1024 70%,#3b0000 100%);
    --bg-panel: rgba(10,10,20,0.85);
    --border: rgba(59,130,246,0.3);
    --accent-primary: #3b82f6;
    --accent-secondary: #ef4444;
    --glow: rgba(59,130,246,0.35);
}

/* UPSIDE DOWN */
body.upside-down {
    --bg-main: linear-gradient(135deg,#090000,#2c0000,#140000);
    --bg-panel: rgba(25,5,5,0.9);
    --border: rgba(220,38,38,0.35);
    --accent-primary: #38bdf8;
    --accent-secondary: #dc2626;
    --glow: rgba(220,38,38,0.45);
}

/* BASE */

body {
    background: var(--bg-main);
    color: var(--text-main);
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    margin:0;
    padding:30px;
    transition: all .4s ease;
}

h1 {
    text-align:center;
    color:var(--accent-secondary);
    text-shadow:0 0 10px var(--glow);
}

/* Theme selector */
.theme-selector {
    position:absolute;
    top:18px;
    right:24px;
    display:flex;
    gap:8px;
    align-items:center;
}

select,button {
    background:var(--button-bg);
    border:1px solid var(--border);
    color:var(--accent-secondary);
    padding:8px 14px;
    border-radius:8px;
    cursor:pointer;
    transition:all .2s ease;
}

select:hover,button:hover {
    background:var(--button-hover);
    box-shadow:0 0 10px var(--glow);
}

.section {
    margin-top:20px;
    padding:20px;
    border-radius:12px;
    background:var(--bg-panel);
    border:1px solid var(--border);
    backdrop-filter:blur(10px);
}

.loading { color:var(--accent-primary); margin-top:15px; }
.error { color:#f87171; margin-top:15px; font-weight:bold; }

ul { padding-left:20px; }
li { margin-bottom:10px; }

</style>
</head>
<body>

<h1>🧠 NeuroLint</h1>

<div class="theme-selector">
<label>Theme</label>
<select onchange="document.body.className=this.value">
<option value="">Dark Mode</option>
<option value="dark-night">Dark Night</option>
<option value="upside-down">Upside Down</option>
</select>
</div>

<div>
<label>Level:</label>
<select id="level">
<option value="beginner">Beginner</option>
<option value="intermediate">Intermediate</option>
<option value="expert">Expert</option>
</select>
</div>

<div>
<label>
<input type="checkbox" id="cognitiveToggle">
Enable Cognitive Mode
</label>
</div>

<button onclick="runAnalysis()">Run Analysis</button>

<div id="loading" class="loading" style="display:none;">
Analyzing selected code...
</div>

<div id="resultBox"></div>

<script>
const vscode = acquireVsCodeApi();

function runAnalysis(){
const level=document.getElementById("level").value;
const cognitive=document.getElementById("cognitiveToggle").checked;
document.getElementById("loading").style.display="block";
document.getElementById("resultBox").innerHTML="";
vscode.postMessage({command:"analyze",mode:level,cognitive:cognitive});
}

window.addEventListener("message",event=>{
const msg=event.data;
const box=document.getElementById("resultBox");

if(msg.command==="result"){
document.getElementById("loading").style.display="none";

const s=msg.data||{};
const validity=s.validity_matrix||{
validity_score:0,
unsupported_claims:[],
confidence_level:"low"
};

const issuesHTML=(s.issues?.length)
? "<ul>"+s.issues.map(i=>"<li><strong>"+(i.type||"issue").toUpperCase()+"</strong><br>"+(i.description||"")+"<br><em>Why it matters:</em> "+(i.why_it_matters||"")+"</li>").join("")+"</ul>"
: "<p>No major cognitive issues detected.</p>";

const suggestionsHTML=(s.refactor_suggestions?.length)
? "<ul>"+s.refactor_suggestions.map(r=>"<li>"+(r.suggestion||"")+" <em>(Impact: "+(r.impact||"medium")+")</em></li>").join("")+"</ul>"
: "<p>No refactor suggestions.</p>";

const unsupportedHTML=(validity.unsupported_claims?.length)
? "<ul>"+validity.unsupported_claims.map(u=>"<li>"+u+"</li>").join("")+"</ul>"
: "<p>No unsupported claims detected.</p>";

box.innerHTML=\`
<div class="section">
<h2>Mode: \${s.mode || "unknown"}</h2>
<p><strong>Cognitive Load Score:</strong> \${s.cognitive_load_score ?? "N/A"}</p>
</div>

<div class="section">
<h3>Explanation</h3>
<p>\${s.explanation || "No explanation returned."}</p>
</div>

<div class="section">
<h3>Issues</h3>
\${issuesHTML}
</div>

<div class="section">
<h3>Refactor Suggestions</h3>
\${suggestionsHTML}
</div>

<div class="section">
<h3>Mental Model</h3>
<p>\${s.mental_model || "No mental model returned."}</p>
</div>

<div class="section">
<h3>Validity Matrix</h3>
<p><strong>Validity Score:</strong> \${validity.validity_score}/10</p>
<p><strong>Confidence:</strong> \${validity.confidence_level}</p>
\${unsupportedHTML}
</div>\`;
}

if(msg.command==="error"){
document.getElementById("loading").style.display="none";
box.innerHTML="<div class='error'><strong>Error:</strong> "+msg.message+"</div>";
}
});
</script>

</body>
</html>`;
}


export function deactivate() {}
