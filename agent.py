"""A tiny four-step LangGraph research assistant for beginners."""

import os
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import TypedDict

from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph
from openai import OpenAI

load_dotenv()


# State: one shared note travels through the graph.
class ResearchState(TypedDict, total=False):
    question: str
    plan: str
    findings: str
    analysis: str
    insights: str
    report: str


def ask_llm(instruction: str, fallback: str) -> str:
    """Ask OpenRouter when configured; otherwise keep the demo offline."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return fallback

    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        response = client.chat.completions.create(
            model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are a careful research assistant. Be concise and label uncertainty."},
                {"role": "user", "content": instruction},
            ],
        )
        return response.choices[0].message.content or fallback
    except Exception as error:
        print(f"[offline] The model was unavailable ({type(error).__name__}); continuing without it.")
        return fallback


# Nodes: each small function does one job and returns only what it added.
def retrieve_step(state: ResearchState) -> dict[str, str]:
    question = state["question"]
    findings = ask_llm(
        f"For this research question, identify the most useful source types, key terms, and 3 evidence angles: {question}",
        f"Source map for '{question}': research papers, industry reports, recent news, and primary data. Key angles: definitions, evidence, and real-world impact.",
    )
    print("-> [retrieve] done — source map added to state")
    return {"findings": findings}


def analyze_step(state: ResearchState) -> dict[str, str]:
    analysis = ask_llm(
        f"Question: {state['question']}\nSource map: {state['findings']}\nCompare the evidence angles, call out likely contradictions, and explain what would need verification.",
        "Critical read: separate established facts from predictions, compare claims across source types, and verify dates, authorship, and original data before drawing conclusions.",
    )
    print("-> [analyze] done — critical analysis added to state")
    return {"analysis": analysis}


def insight_step(state: ResearchState) -> dict[str, str]:
    insights = ask_llm(
        f"Question: {state['question']}\nAnalysis: {state['analysis']}\nSuggest 3 useful insights or hypotheses. For each, include why it matters and one caveat.",
        "Three useful hypotheses: the strongest pattern is usually operational rather than magical; collaboration works best when roles are explicit; and quality depends on source checking. Caveat: offline mode has not retrieved live sources.",
    )
    print("-> [insight] done — hypotheses added to state")
    return {"insights": insights}


def report_step(state: ResearchState) -> dict[str, str]:
    report = ask_llm(
        f"Write a short structured report for: {state['question']}\nFindings: {state['findings']}\nAnalysis: {state['analysis']}\nInsights: {state['insights']}\nUse headings: Executive summary, What the evidence suggests, Caveats, Next questions.",
        f"EXECUTIVE SUMMARY\n{state['question']}\n\nWHAT THE EVIDENCE SUGGESTS\nA multi-step investigation combines a source map, critical reading, and explicit hypotheses before producing a report.\n\nCAVEATS\nThis run used offline starter text; add an OpenRouter key for model-generated analysis and verify primary sources.\n\nNEXT QUESTIONS\nWhich claim deserves a deeper source check?",
    )
    print("-> [report] done — final report added to state")
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
app = builder.compile()


def main() -> None:
    # Run: invoke the compiled graph with the participant's own question.
    question = " ".join(sys.argv[1:]).strip() or input("What would you like your agent to research? ")
    run_question(question)


def run_question(question: str) -> ResearchState:
    """Run one question through the graph and return the completed state."""
    print(f"\nStarting research for: {question}\n")
    final_state = app.invoke({"question": question})
    print("\n=== FINAL REPORT ===\n")
    print(final_state["report"])
    print("\nYou just ran a real LangGraph pipeline: State -> Nodes -> Edges.")
    print("Reducers and checkpointers are natural next steps, but we kept them out of this first build.")
    return final_state


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
            final_state = run_question(question)
            self.send_json(200, {"question": question, "report": final_state["report"]})
        except Exception as error:
            self.send_json(500, {"error": f"The agent could not finish: {type(error).__name__}"})


def serve() -> None:
    print("Researcher agent bridge listening at http://127.0.0.1:8787")
    print("Keep this terminal open while using the dashboard. Press Ctrl+C to stop.\n")
    HTTPServer(("127.0.0.1", 8787), AgentHandler).serve_forever()


if __name__ == "__main__":
    if sys.argv[1:] == ["--serve"]:
        serve()
    else:
        main()
