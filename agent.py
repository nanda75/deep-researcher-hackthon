"""A tiny four-step LangGraph research assistant for beginners."""

import os
import json
import sys
import warnings
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Callable, TypedDict

from dotenv import load_dotenv

warnings.filterwarnings(
    "ignore",
    message="Core Pydantic V1 functionality isn't compatible with Python 3.14 or greater.",
    category=UserWarning,
)

from langgraph.graph import END, START, StateGraph
from langchain_openrouter import ChatOpenRouter

load_dotenv()

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
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def send_json(self, status: int, payload: dict[str, str]) -> None:
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
        self.send_json(404, {"error": "Try GET /health or POST /run."})

    def do_POST(self) -> None:
        if self.path != "/run":
            self.send_json(404, {"error": "Try POST /run."})
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            request = json.loads(self.rfile.read(length) or b"{}")
            question = str(request.get("question", "")).strip()
            if not question:
                self.send_json(400, {"error": "Please include a question."})
                return
            step_indexes = {"retrieve": 0, "analyze": 1, "insight": 2, "report": 3}
            self.send_response(200)
            self.add_cors()
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            def emit(event: dict[str, object]) -> None:
                event["index"] = step_indexes.get(str(event.get("step", "")), -1)
                self.wfile.write(f"data: {json.dumps(event)}\n\n".encode("utf-8"))
                self.wfile.flush()

            final_state = run_question(question, emit)
            emit({"type": "complete", "question": question, "report": final_state["report"]})
        except Exception as error:
            try:
                self.send_json(500, {"error": f"The agent could not finish: {type(error).__name__}"})
            except (BrokenPipeError, ConnectionResetError):
                pass


def serve() -> None:
    print("Researcher agent bridge listening at http://127.0.0.1:8787")
    print("Keep this terminal open while using the dashboard. Press Ctrl+C to stop.\n")
    HTTPServer(("127.0.0.1", 8787), AgentHandler).serve_forever()


if __name__ == "__main__":
    if sys.argv[1:] == ["--serve"]:
        serve()
    else:
        main()
