# Deep Researcher — Prerequisite Setup and Validation

This guide is for macOS. It checks whether required software is already installed before recommending installation. Run all commands from the project directory:

```bash
cd /Users/nandarajan/Documents/workarea/deep-researcher-hackthon
```

## Required software

| Software | Required version | Purpose |
| --- | --- | --- |
| Python | 3.11–3.13 recommended | LangGraph agent and Python bridge |
| Node.js | 22.13 or newer | Frontend development and build |
| npm | Included with Node.js | Frontend package installation |
| Git | Any current version | Source control |
| SQLite | Python module available | Local authentication and run history |

Homebrew is optional, but is the simplest way to install missing macOS tools.

## 1. Check before installing

Run this validation block first. It does not install or change anything:

```bash
command -v python3 && python3 --version || echo "Python is missing"
command -v node && node --version || echo "Node.js is missing"
command -v npm && npm --version || echo "npm is missing"
command -v git && git --version || echo "Git is missing"

python3 -c "import sqlite3; print('SQLite Python module: available')" 2>/dev/null \
  || echo "SQLite Python module is unavailable"
```

Expected minimum versions:

```text
Python: 3.11 or newer; 3.12 is recommended
Node.js: v22.13.0 or newer
npm: installed with Node.js
Git: installed
SQLite Python module: available
```

Check the Node.js major and minor version:

```bash
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error("Node.js 22.13+ is required"); process.exit(1); } console.log("Node.js version is supported")'
```

Check the Python version:

```bash
python3 -c 'import sys; ok = (sys.version_info.major == 3 and 11 <= sys.version_info.minor <= 13); print("Python version is supported" if ok else "Use Python 3.11–3.13, preferably 3.12"); sys.exit(0 if ok else 1)'
```

## 2. Install only what is missing

### Install Homebrew only if it is missing

```bash
if command -v brew >/dev/null 2>&1; then
  echo "Homebrew is already installed: $(brew --version | head -n 1)"
else
  echo "Homebrew is not installed. Install it from https://brew.sh"
fi
```

If Homebrew is missing, install it using the official command, then reopen the terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install Python only if a supported version is missing

```bash
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(0 if sys.version_info[:2] in [(3, 11), (3, 12), (3, 13)] else 1)'; then
  echo "A supported Python version is already installed: $(python3 --version)"
else
  brew install python@3.12
fi
```

### Install Node.js only if the supported version is missing

```bash
if command -v node >/dev/null 2>&1 && node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)'; then
  echo "A supported Node.js version is already installed: $(node --version)"
else
  brew install node
fi
```

### Install Git only if it is missing

```bash
if command -v git >/dev/null 2>&1; then
  echo "Git is already installed: $(git --version)"
else
  brew install git
fi
```

SQLite does not need a separate installation for this application. The Python `sqlite3` module is sufficient for `researcher.sqlite3`, authentication, sessions, and run history.

## 3. Install project dependencies

Create and activate the Python virtual environment. The creation command is safe to rerun; use the existing environment if it is already present:

```bash
if [ -d .venv ]; then
  echo "Python virtual environment already exists"
else
  python3 -m venv .venv
fi

source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

Install JavaScript packages only when `node_modules` is missing or dependencies have changed:

```bash
if [ -d node_modules ]; then
  echo "JavaScript dependencies are already installed"
else
  npm install
fi
```

## 4. Optional LangGraph Studio setup

Check whether the LangGraph CLI is already available:

```bash
if command -v langgraph >/dev/null 2>&1; then
  langgraph --help >/dev/null && echo "LangGraph CLI is available"
else
  echo "LangGraph CLI is not installed"
fi
```

Install it only if missing, inside the activated virtual environment:

```bash
if command -v langgraph >/dev/null 2>&1; then
  echo "Skipping LangGraph CLI installation"
else
  python3 -m pip install "langgraph-cli[inmem]"
fi
```

Start Studio on the port checked by the UI:

```bash
langgraph dev --port 2024
```

Validate that it is running:

```bash
curl --fail --silent http://127.0.0.1:2024/ok && echo "LangGraph Studio is running"
```

## 5. Configure environment variables

Create `.env` only when it does not exist, so an existing local configuration is not overwritten:

```bash
if [ -f .env ]; then
  echo ".env already exists; leaving it unchanged"
else
  cp .env.example .env
  echo "Created .env from .env.example"
fi
```

For model responses and LangSmith traces, add the keys manually to `.env`:

```env
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
LANGSMITH_API_KEY=your-langsmith-key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=researcher-agent
```

Do not commit `.env` or place credentials in source files. The application can run with offline fallback text when `OPENROUTER_API_KEY` is blank.

## 6. Final installation validation

Run these checks after installation:

```bash
source .venv/bin/activate
python3 -c "import langgraph, langchain, langchain_openrouter, langsmith; print('Python dependencies: available')"
python3 -c "import sqlite3; print('SQLite: available')"
npm run lint
npm run build
```

Check the Python bridge in a separate terminal:

```bash
source .venv/bin/activate
python3 agent.py --serve
```

Then, from another terminal:

```bash
curl --fail --silent http://127.0.0.1:8787/health
```

Expected response:

```json
{"status": "ready", "message": "Researcher agent is ready."}
```

Start the dashboard:

```bash
npm run dev
```

Open the displayed local URL, register or log in, and run a research question. The sidebar reports the local Studio status independently from the Python bridge.

## Troubleshooting

- `command not found: python3`: install Python with Homebrew, then reopen the terminal.
- Python Pydantic V1 warning: use Python 3.12 or 3.13 instead of Python 3.14.
- `npm` or `node` missing: install Node.js with Homebrew and confirm `node --version` is at least `22.13.0`.
- Studio shows “not running”: run `langgraph dev --port 2024` and click Check in the UI.
- Dashboard cannot reach the agent: confirm `python3 agent.py --serve` is running on port `8787`.
- Port 3000 is busy: use the alternate dashboard port shown by the dev server; ports 3000 and 3001 are permitted by the bridge CORS policy.
