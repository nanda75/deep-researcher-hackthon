# Deep Researcher — beginner LangGraph agent

This project has two parts: the Researcher. dashboard is the visual companion, and `agent.py` is the real end-to-end LangGraph agent required by the workshop brief.

For the architecture, technical approach, functional flow, authentication, and safety details, see the [Implementation Overview](IMPLEMENTATION.md).

For prerequisite installation and validation checks, see the [Prerequisite Setup Guide](SETUP_PREREQUISITES.md).

## Run it on macOS

Python 3.11 or newer is required. This computer has Python 3.14.

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
cp .env.example .env
python3 agent.py "How are multi-agent systems changing knowledge work?"
```

The virtual environment is a private box of libraries for this project. The agent still runs without an API key using its offline fallback.

## Build the dashboard
```bash
npm install
npm run build
```

## Connect the dashboard to Python

### Terminal -1
Start the local bridge in one terminal:

```bash
source .venv/bin/activate
python3 agent.py --serve
```

Keep that terminal open, then start the dashboard in another:

### Terminal -2
Start the local dashboard in second terminal :
```bash
npm run dev
```

Open the localhost URL, enter a question, and click **Run research**. The button sends the question to `agent.py`, which runs all four LangGraph nodes and returns the report to the UI. If the bridge is not running, the dashboard stays usable in demo mode and tells you exactly how to connect it.

## Optional model replies and LangSmith tracing

Create a free key at [OpenRouter](https://openrouter.ai/keys), then put it in `.env`:

```bash
OPENROUTER_API_KEY=sk-or-your-key
OPENROUTER_MODEL=openai/gpt-4o-mini
LANGSMITH_API_KEY=lsv2_your-key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=researcher-agent
```

The graph uses LangChain's `ChatOpenRouter` integration. When LangSmith tracing is enabled, each named node is sent to the `researcher-agent` project. Never put a real key in `agent.py` or commit `.env`.

## What to watch for

The terminal prints four visible nodes in order: `retrieve -> analyze -> insight -> report`. Each node receives the shared state and returns only the new piece it created. The arrows between nodes are the edges.

Try your own question, then add a fifth node such as `translate` or `shorten`.

## Validate LangGraph / LangSmith Studio

Start the local LangGraph Studio-compatible server from the project root:

```bash
langgraph dev --port 2024
```

After it starts, the sidebar’s **LangSmith Studio** card checks `http://127.0.0.1:2024/ok` and reports whether the local Studio is connected. The card also links to the LangSmith workspace at [smith.langchain.com](https://smith.langchain.com).
