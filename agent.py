"""A tiny four-step LangGraph research assistant for beginners."""

import os
import json
import sys
import hashlib
import secrets
import sqlite3
import time
import warnings
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Callable, TypedDict
from urllib.parse import parse_qs, urlparse

from dotenv import load_dotenv

warnings.filterwarnings(
    "ignore",
    message="Core Pydantic V1 functionality isn't compatible with Python 3.14 or greater.",
    category=UserWarning,
)

from langgraph.graph import END, START, StateGraph
from langchain_openrouter import ChatOpenRouter

load_dotenv()

DB_PATH = os.getenv("RESEARCHER_DB_PATH", "researcher.sqlite3")


def database() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    with database() as connection:
        connection.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', nickname TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL)")
        for column in ("name", "nickname"):
            try:
                connection.execute(f"ALTER TABLE users ADD COLUMN {column} TEXT NOT NULL DEFAULT ''")
            except sqlite3.OperationalError:
                pass
        connection.execute("CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)")
        connection.execute("CREATE TABLE IF NOT EXISTS runs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, question TEXT NOT NULL, report TEXT NOT NULL, sources_json TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)")
        connection.execute("CREATE INDEX IF NOT EXISTS runs_user_created_idx ON runs(user_id, created_at DESC)")


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${digest}"


def password_matches(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
        candidate = password_hash(password, salt).split("$", 1)[1]
        return secrets.compare_digest(candidate, digest)
    except ValueError:
        return False


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with database() as connection:
        connection.execute("INSERT INTO sessions (token_hash, user_id, created_at) VALUES (?, ?, ?)", (token_hash, user_id, int(time.time())))
    return token


def session_user(token: str) -> int | None:
    if not token:
        return None
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with database() as connection:
        row = connection.execute("SELECT user_id FROM sessions WHERE token_hash = ?", (token_hash,)).fetchone()
    return int(row["user_id"]) if row else None


initialize_database()

ProgressCallback = Callable[[dict[str, object]], None]
_progress_callback: ProgressCallback | None = None


def notify_progress(step: str, status: str, message: str, content: str = "", sources: list[dict[str, object]] | None = None) -> None:
    """Print progress in the terminal and optionally send it to the dashboard."""
    print(f"-> [{step}] {status} — {message}")
    if _progress_callback:
        _progress_callback({"type": "step", "step": step, "status": status, "message": message, "content": content, "sources": sources or []})


# State: one shared note travels through the graph.
class ResearchState(TypedDict, total=False):
    question: str
    plan: str
    findings: str
    sources: list[dict[str, object]]
    analysis: str
    insights: str
    report: str


def ask_llm(instruction: str, fallback: str, step_name: str) -> str:
    """Ask OpenRouter through LangChain; otherwise keep the demo offline."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return fallback

    try:
        model = ChatOpenRouter(
            model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
            api_key=api_key,
            temperature=0,
        )
        response = model.with_config({"run_name": step_name, "tags": ["researcher", step_name]}).invoke(
            [
                ("system", "You are a careful research assistant. Be concise and label uncertainty."),
                ("human", instruction),
            ]
        )
        content = response.content
        return content if isinstance(content, str) and content else fallback
    except Exception as error:
        print(f"[offline] The model was unavailable ({type(error).__name__}); continuing without it.")
        return fallback


def extract_sources(raw: str, question: str) -> list[dict[str, object]]:
    """Turn the retriever's JSON into safe UI records, with an offline fallback."""
    try:
        cleaned = raw.strip().removeprefix("```json").removesuffix("```").strip()
        records = json.loads(cleaned)
        if isinstance(records, list):
            valid = []
            for record in records[:6]:
                if not isinstance(record, dict) or not record.get("title"):
                    continue
                title = str(record["title"])
                url = str(record.get("url", ""))
                if not url.startswith(("http://", "https://")):
                    url = ""
                valid.append({
                    "type": str(record.get("type", "SOURCE")).upper(),
                    "title": title,
                    "meta": str(record.get("meta", "LLM retriever")),
                    "score": str(record.get("score", "—")),
                    "url": url,
                })
            if valid:
                return valid
    except (ValueError, TypeError):
        pass
    return []


def save_run(user_id: int, question: str, state: ResearchState) -> None:
    with database() as connection:
        connection.execute(
            "INSERT INTO runs (user_id, question, report, sources_json, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, question, state.get("report", ""), json.dumps(state.get("sources", [])), int(time.time())),
        )

# Nodes: each small function does one job and returns only what it added.
def retrieve_step(state: ResearchState) -> dict[str, object]:
    question = state["question"]
    notify_progress("retrieve", "running", "Gathering source angles")
    findings = ask_llm(
        f"For this research question, return exactly 3 useful sources as a JSON array only. Each item must have type (PAPER, REPORT, or NEWS), title, meta (publisher and year/date), score (0-100%), and url. Use real, verifiable URLs when you know them; otherwise use an empty url. Question: {question}",
        "[]",
        "contextual_retriever",
    )
    sources = extract_sources(findings, question)
    notify_progress("retrieve", "complete", "Source intelligence extracted", findings, sources)
    return {"findings": findings, "sources": sources}


def analyze_step(state: ResearchState) -> dict[str, str]:
    notify_progress("analyze", "running", "Validating findings")
    analysis = ask_llm(
        f"Question: {state['question']}\nSource map: {state['findings']}\nCompare the evidence angles, call out likely contradictions, and explain what would need verification.",
        "Critical read: separate established facts from predictions, compare claims across source types, and verify dates, authorship, and original data before drawing conclusions.",
        "critical_analysis",
    )
    notify_progress("analyze", "complete", "Critical analysis added to state", analysis)
    return {"analysis": analysis}


def insight_step(state: ResearchState) -> dict[str, str]:
    notify_progress("insight", "running", "Connecting patterns")
    insights = ask_llm(
        f"Question: {state['question']}\nAnalysis: {state['analysis']}\nSuggest 3 useful insights or hypotheses. For each, include why it matters and one caveat.",
        "Three useful hypotheses: the strongest pattern is usually operational rather than magical; collaboration works best when roles are explicit; and quality depends on source checking. Caveat: offline mode has not retrieved live sources.",
        "insight_generation",
    )
    notify_progress("insight", "complete", "Hypotheses added to state", insights)
    return {"insights": insights}


def report_step(state: ResearchState) -> dict[str, str]:
    notify_progress("report", "running", "Compiling the brief")
    report = ask_llm(
        f"Write a short structured report for: {state['question']}\nFindings: {state['findings']}\nAnalysis: {state['analysis']}\nInsights: {state['insights']}\nUse headings: Executive summary, What the evidence suggests, Caveats, Next questions.",
        f"EXECUTIVE SUMMARY\n{state['question']}\n\nWHAT THE EVIDENCE SUGGESTS\nA multi-step investigation combines a source map, critical reading, and explicit hypotheses before producing a report.\n\nCAVEATS\nThis run used offline starter text; add an OpenRouter key for model-generated analysis and verify primary sources.\n\nNEXT QUESTIONS\nWhich claim deserves a deeper source check?",
        "report_builder",
    )
    notify_progress("report", "complete", "Final report added to state", report)
    return {"report": report}


# Wiring: START points to each named node, then the graph ends after the report.
builder = StateGraph(ResearchState)
builder.add_node("retrieve", retrieve_step)
builder.add_node("analyze", analyze_step)
builder.add_node("insight", insight_step)
builder.add_node("report", report_step)
builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "analyze")
builder.add_edge("analyze", "insight")
builder.add_edge("insight", "report")
builder.add_edge("report", END)
graph = builder.compile()
app = graph  # Keep the older app name working for the local CLI and bridge.


def main() -> None:
    # Run: invoke the compiled graph with the participant's own question.
    question = " ".join(sys.argv[1:]).strip() or input("What would you like your agent to research? ")
    run_question(question)


def run_question(question: str, progress_callback: ProgressCallback | None = None) -> ResearchState:
    """Run one question through the graph and return the completed state."""
    global _progress_callback
    previous_callback = _progress_callback
    _progress_callback = progress_callback
    print(f"\nStarting research for: {question}\n")
    try:
        final_state = graph.invoke({"question": question})
        print("\n=== FINAL REPORT ===\n")
        print(final_state["report"])
        print("\nYou just ran a real LangGraph pipeline: State -> Nodes -> Edges.")
        print("Reducers and checkpointers are natural next steps, but we kept them out of this first build.")
        return final_state
    finally:
        _progress_callback = previous_callback


class AgentHandler(BaseHTTPRequestHandler):
    """A tiny standard-library bridge for the browser UI."""

    def add_cors(self) -> None:
        origin = self.headers.get("Origin", "")
        if origin in {
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        }:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def send_json(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.add_cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.add_cors()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_json(200, {"status": "ready", "message": "Researcher agent is ready."})
            return
        if urlparse(self.path).path == "/history":
            token = self.headers.get("Authorization", "").removeprefix("Bearer ").strip()
            user_id = session_user(token)
            if user_id is None:
                self.send_json(401, {"error": "Please sign in before viewing history."})
                return
            with database() as connection:
                rows = connection.execute("SELECT id, question, report, sources_json, created_at FROM runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", (user_id,)).fetchall()
            self.send_json(200, {"runs": [{"id": row["id"], "question": row["question"], "report": row["report"], "sources": json.loads(row["sources_json"]), "created_at": row["created_at"]} for row in rows]})
            return
        self.send_json(404, {"error": "Try GET /health or POST /run."})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path not in ("/run", "/history/clear", "/auth/register", "/auth/login", "/auth/forgot", "/auth/logout"):
            self.send_json(404, {"error": "Try POST /run."})
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            request = json.loads(self.rfile.read(length) or b"{}")
            if path == "/auth/logout":
                token = self.headers.get("Authorization", "").removeprefix("Bearer ").strip()
                if token:
                    token_hash = hashlib.sha256(token.encode()).hexdigest()
                    with database() as connection:
                        connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
                self.send_json(200, {"message": "Signed out."})
                return
            if path == "/history/clear":
                token = self.headers.get("Authorization", "").removeprefix("Bearer ").strip()
                user_id = session_user(token)
                if user_id is None:
                    self.send_json(401, {"error": "Please sign in before clearing history."})
                    return
                with database() as connection:
                    connection.execute("DELETE FROM runs WHERE user_id = ?", (user_id,))
                self.send_json(200, {"message": "Investigation history cleared."})
                return
            if path.startswith("/auth/"):
                email = str(request.get("email", "")).strip().lower()
                password = str(request.get("password", ""))
                name = str(request.get("name", "")).strip()
                nickname = str(request.get("nickname", "")).strip()
                if "@" not in email or (path != "/auth/forgot" and len(password) < 8):
                    self.send_json(400, {"error": "Use a valid email and a password of at least 8 characters."})
                    return
                if path == "/auth/register" and (not name or not nickname):
                    self.send_json(400, {"error": "Name and nickname are required for registration."})
                    return
                if path == "/auth/forgot":
                    self.send_json(200, {"message": "If that account exists, reset instructions will be sent when email delivery is configured."})
                    return
                with database() as connection:
                    row = connection.execute("SELECT id, email, password_hash, name, nickname FROM users WHERE email = ?", (email,)).fetchone()
                    if path == "/auth/register":
                        if row:
                            self.send_json(409, {"error": "An account with this email already exists."})
                            return
                        cursor = connection.execute("INSERT INTO users (email, password_hash, name, nickname, created_at) VALUES (?, ?, ?, ?, ?)", (email, password_hash(password), name, nickname, int(time.time())))
                        user_id = int(cursor.lastrowid)
                    else:
                        if not row or not password_matches(password, row["password_hash"]):
                            self.send_json(401, {"error": "Email or password is incorrect."})
                            return
                        user_id = int(row["id"])
                self.send_json(200, {"user": {"id": user_id, "email": email, "name": name or row["name"], "nickname": nickname or row["nickname"]}, "token": create_session(user_id)})
                return

            question = str(request.get("question", "")).strip()
            if not question:
                self.send_json(400, {"error": "Please include a question."})
                return
            token = self.headers.get("Authorization", "").removeprefix("Bearer ").strip()
            user_id = session_user(token)
            if user_id is None:
                self.send_json(401, {"error": "Please sign in before running research."})
                return
            step_indexes = {"retrieve": 0, "analyze": 1, "insight": 2, "report": 3}
            self.send_response(200)
            self.add_cors()
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            def emit(event: dict[str, object]) -> None:
                event["index"] = step_indexes.get(str(event.get("step", "")), -1)
                self.wfile.write(f"data: {json.dumps(event)}\n\n".encode("utf-8"))
                self.wfile.flush()

            final_state = run_question(question, emit)
            save_run(user_id, question, final_state)
            emit({"type": "complete", "question": question, "report": final_state["report"]})
            # This bridge handles one request at a time. Closing the completed
            # SSE response releases the server for the next investigation.
            self.close_connection = True
        except Exception as error:
            try:
                self.send_json(500, {"error": f"The agent could not finish: {type(error).__name__}"})
            except (BrokenPipeError, ConnectionResetError):
                pass


def serve() -> None:
    print("Researcher agent bridge listening at http://127.0.0.1:8787")
    print("Keep this terminal open while using the dashboard. Press Ctrl+C to stop.\n")
    server = HTTPServer(("127.0.0.1", 8787), AgentHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nResearcher agent bridge stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    if sys.argv[1:] == ["--serve"]:
        serve()
    else:
        main()
