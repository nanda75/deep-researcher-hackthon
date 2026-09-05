"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Compass,
  FileText,
  Layers3,
  Lightbulb,
  Menu,
  Network,
  PanelLeft,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

const steps = [
  { key: "retrieve", label: "Contextual Retriever", caption: "Gathering sources", icon: Search },
  { key: "analyze", label: "Critical Analysis", caption: "Validating findings", icon: Network },
  { key: "insight", label: "Insight Generation", caption: "Connecting patterns", icon: Lightbulb },
  { key: "report", label: "Report Builder", caption: "Compiling your brief", icon: FileText },
];

const sources = [
  {
    type: "PAPER",
    title: "The State of Multi-Agent Systems",
    meta: "ACM Digital Library · 2024",
    score: "98%",
    color: "blue",
    url: "https://scholar.google.com/",
  },
  {
    type: "REPORT",
    title: "AI Index Report 2024",
    meta: "Stanford HAI · 2024",
    score: "94%",
    color: "violet",
    url: "https://aiindex.stanford.edu/",
  },
  {
    type: "NEWS",
    title: "Why agentic workflows are taking off",
    meta: "The Verge · 3 days ago",
    score: "89%",
    color: "amber",
    url: "https://news.google.com/",
  },
];

export default function Home() {
  const [query, setQuery] = useState("How are multi-agent systems changing knowledge work?");
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [findings, setFindings] = useState("");
  const [sourceCards, setSourceCards] = useState<Array<(typeof sources)[number]>>([]);
  const [runHistory, setRunHistory] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState("No completed investigation yet");
  const [activeSection, setActiveSection] = useState("workspace");
  const [report, setReport] = useState(
    "A concise synthesis of how multi-agent architectures are changing the way teams investigate, decide, and create.",
  );
  const [connection, setConnection] = useState(
    "Start the local agent bridge to run this question for real.",
  );
  const [authMode, setAuthMode] = useState<"register" | "login" | "forgot">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string;
    nickname: string;
  } | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [authName, setAuthName] = useState("");
  const [authNickname, setAuthNickname] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [studioStatus, setStudioStatus] = useState<"checking" | "connected" | "offline">(
    "checking",
  );

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeMenu = () => setAccountMenuOpen(false);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [accountMenuOpen]);

  async function checkStudio() {
    setStudioStatus("checking");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch("http://127.0.0.1:2024/ok", {
        signal: controller.signal,
      });
      setStudioStatus(response.ok ? "connected" : "offline");
    } catch {
      setStudioStatus("offline");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  useEffect(() => {
    void checkStudio();
  }, []);

  function scrollToId(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetInvestigation() {
    setQuery("");
    setRunning(false);
    setActiveStep(-1);
    setCompletedSteps([false, false, false, false]);
    setFindings("");
    setSourceCards([]);
    setReportTitle("No completed investigation yet");
    setReport("A concise synthesis will appear after you run a new investigation.");
    setConnection("Start the local agent bridge to run this question for real.");
    scrollToId("composer");
  }

  async function clearHistory() {
    if (!window.confirm("Clear all saved investigations and recent runs? This cannot be undone."))
      return;
    // Clear the visible state immediately, then persist the deletion.
    setRunHistory([]);
    resetInvestigation();
    try {
      const response = await fetch("http://127.0.0.1:8787/history/clear", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!response.ok) throw new Error("The Python bridge rejected the clear request.");
    } catch {
      setConnection("Runs cleared on screen. Restart agent.py to sync the database.");
    }
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const response = await fetch(`http://127.0.0.1:8787/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          name: authName,
          nickname: authNickname,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        token?: string;
        user?: { id: number; email: string; name: string; nickname: string };
      };
      if (!response.ok) throw new Error(result.error || "Authentication failed.");
      if (authMode === "forgot") {
        setAuthError(result.message || "Check your email for reset instructions.");
        return;
      }
      if (!result.user || !result.token)
        throw new Error("The agent did not return a valid session.");
      setUser(result.user);
      setSessionToken(result.token);
      setAuthPassword("");
      const history = await fetch("http://127.0.0.1:8787/history", {
        headers: { Authorization: `Bearer ${result.token}` },
      });
      if (history.ok) {
        const historyResult = (await history.json()) as { runs?: Array<{ question: string }> };
        setRunHistory((historyResult.runs || []).map((run) => run.question));
      }
      resetInvestigation();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function runResearch() {
    if (running) return;
    if (!sessionToken) {
      setConnection("Your session has expired. Please log in again.");
      setUser(null);
      setAuthMode("login");
      return;
    }
    setRunning(true);
    setActiveStep(-1);
    setCompletedSteps([false, false, false, false]);
    setFindings("");
    setSourceCards([]);
    setConnection("Connecting to agent.py...");
    try {
      const response = await fetch("http://127.0.0.1:8787/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ question: query }),
      });
      if (!response.ok) {
        const errorResult = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorResult.error || "Agent bridge is not ready");
      }
      if (!response.body) throw new Error("Agent did not return a live stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const eventText of events) {
          const line = eventText.split("\n").find((item) => item.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as {
            type: string;
            index?: number;
            status?: string;
            message?: string;
            content?: string;
            report?: string;
            question?: string;
            sources?: Array<{
              type: string;
              title: string;
              meta: string;
              score: string;
              url: string;
            }>;
          };
          if (event.type === "step" && typeof event.index === "number") {
            setActiveStep(event.index);
            setConnection(event.message || "Agent step updated");
            if (event.index === 0 && event.status === "complete") {
              const liveFindings = event.content || "";
              setFindings(liveFindings);
              if (event.sources?.length)
                setSourceCards(
                  event.sources.map((source, index) => ({
                    ...source,
                    color: sources[index % sources.length].color,
                  })),
                );
            }
            if (event.status === "complete")
              setCompletedSteps((previous) =>
                previous.map((done, index) => done || index === event.index),
              );
          }
          if (event.type === "complete") {
            const completedQuestion = event.question || query;
            setReport(event.report || "The agent completed without a report.");
            setReportTitle(`Research brief · ${completedQuestion}`);
            setRunHistory((previous) =>
              [completedQuestion, ...previous.filter((item) => item !== completedQuestion)].slice(
                0,
                4,
              ),
            );
            setCompletedSteps([true, true, true, true]);
            setActiveStep(3);
            setConnection("Live agent connected · report refreshed");
            // This is the explicit completion callback from agent.py. Do not
            // wait for the streaming HTTP connection to close before re-enabling.
            setRunning(false);
            await reader.cancel();
            return;
          }
        }
        if (chunk.done) break;
      }
    } catch (error) {
      setConnection(error instanceof Error ? error.message : "The research request was blocked.");
    } finally {
      setRunning(false);
    }
  }

  async function logOff() {
    await fetch("http://127.0.0.1:8787/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
    }).catch(() => undefined);
    setUser(null);
    setSessionToken("");
    setAuthMode("login");
    resetInvestigation();
  }

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090c] px-5 text-zinc-100">
        <section className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d1014] p-7 shadow-2xl">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300 text-[#08090c]">
              <Compass size={18} />
            </div>
            <span className="font-mono text-sm font-bold">
              DEEP RESEARCHER<span className="text-cyan-300">.</span>
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {authMode === "register"
              ? "Create your account"
              : authMode === "login"
                ? "Welcome back"
                : "Reset your password"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {authMode === "register"
              ? "Register to save investigations and use your private research workspace."
              : authMode === "login"
                ? "Sign in to continue to your research workspace."
                : "Enter your email. Reset instructions require email delivery to be configured."}
          </p>
          <form onSubmit={submitAuth} className="mt-6 space-y-4">
            {authMode === "register" && (
              <>
                <input
                  required
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/60"
                />
                <input
                  required
                  value={authNickname}
                  onChange={(event) => setAuthNickname(event.target.value)}
                  placeholder="Nickname"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/60"
                />
              </>
            )}
            <input
              required
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/60"
            />
            {authMode !== "forgot" && (
              <input
                required
                minLength={8}
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Password (8+ characters)"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/60"
              />
            )}
            {authError && (
              <p className="text-xs leading-5 text-amber-300" role="alert">
                {authError}
              </p>
            )}
            <button
              disabled={authBusy}
              className="w-full rounded-lg bg-cyan-300 px-4 py-3 text-xs font-bold text-black hover:bg-cyan-200 disabled:opacity-60"
            >
              {authBusy
                ? "Please wait..."
                : authMode === "register"
                  ? "Register"
                  : authMode === "login"
                    ? "Login"
                    : "Request reset instructions"}
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-zinc-500">
            <button
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
              className={authMode === "register" ? "text-cyan-300" : "hover:text-white"}
            >
              Register
            </button>
            <button
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
              className={authMode === "login" ? "text-cyan-300" : "hover:text-white"}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode("forgot");
                setAuthError("");
              }}
              className={authMode === "forgot" ? "text-cyan-300" : "hover:text-white"}
            >
              Forgot password?
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-zinc-100 selection:bg-cyan-300 selection:text-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#08090c]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300 text-[#08090c] shadow-[0_0_26px_rgba(103,232,249,0.22)]">
              <Compass size={18} strokeWidth={2.5} />
            </div>
            <span className="font-mono text-sm font-bold tracking-tight">
              DEEP RESEARCHER<span className="text-cyan-300">.</span>
            </span>
          </div>
          <div className="relative flex items-center gap-3">
            <button
              onClick={(event) => {
                event.stopPropagation();
                setAccountMenuOpen(!accountMenuOpen);
              }}
              aria-expanded={accountMenuOpen}
              aria-label="Open account menu"
              className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-pink-400 text-xs font-bold text-black"
            >
              {user.nickname.slice(0, 2).toUpperCase()}
            </button>
            {accountMenuOpen && (
              <div
                onClick={(event) => event.stopPropagation()}
                className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-white/10 bg-[#10151b] p-2 shadow-2xl"
              >
                <p className="px-3 py-2 text-xs font-semibold text-white">{user.nickname}</p>
                <p className="truncate px-3 pb-2 text-[10px] text-zinc-500">{user.email}</p>
                <button
                  onClick={logOff}
                  className="w-full rounded-lg border-t border-white/[0.08] px-3 py-2 text-left text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  Log off
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px] pt-[74px]">
        <aside
          className={`${sidebarOpen ? "fixed inset-y-[74px] left-0 z-40 flex w-[250px] bg-[#0b0d11] shadow-2xl" : "hidden"} w-[250px] shrink-0 border-r border-white/[0.07] px-5 py-7 lg:flex lg:flex-col`}
        >
          <div className="mb-7 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Workspace
            </span>
            <button
              className="text-zinc-600 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <button
            onClick={resetInvestigation}
            className="mb-7 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 py-3 text-xs font-bold text-black transition hover:bg-cyan-200"
          >
            <Plus size={15} /> New investigation
          </button>
          <nav className="space-y-1 text-sm">
            {[
              ["Overview", PanelLeft, "workspace"],
              ["My investigations", BookOpen, "report"],
              ["Source library", Layers3, "sources"],
            ].map(([name, Icon, target]) => (
              <button
                onClick={() => scrollToId(target as string)}
                key={name as string}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${activeSection === target ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"}`}
              >
                <Icon size={16} />
                {name as string}
                {target === "report" && (
                  <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                    {runHistory.length}
                  </span>
                )}
                {target === "sources" && findings && (
                  <span className="ml-auto rounded bg-cyan-300/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                    LIVE
                  </span>
                )}
              </button>
            ))}
          </nav>
          <button
            onClick={clearHistory}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-500 hover:bg-white/[0.04] hover:text-red-300"
          >
            <Trash2 size={16} />
            Clear My Investigations
          </button>
          <div className="mt-5 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2">
              <a
                href="https://smith.langchain.com"
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-300 hover:text-cyan-300"
              >
                <Compass size={14} className="shrink-0 text-cyan-300" />
                <span className="truncate">LangSmith Studio</span>
                <ArrowUpRight size={13} className="shrink-0" />
              </a>
              <button
                onClick={checkStudio}
                aria-label="Check LangSmith Studio status"
                className="shrink-0 text-[10px] text-zinc-600 hover:text-white"
              >
                Check
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-zinc-600">
              {studioStatus === "checking" && "Checking local Studio…"}
              {studioStatus === "connected" && "Local Studio connected · :2024"}
              {studioStatus === "offline" && "Local Studio not running"}
            </p>
          </div>
          <div className="my-8 h-px bg-white/[0.07]" />
          <span className="mb-3 block px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            Recent runs · {runHistory.length}
          </span>
          <div className="space-y-1">
            {(runHistory.length ? runHistory : ["No completed runs yet"]).map((item, i) => (
              <button
                key={item}
                disabled={!runHistory.length}
                onClick={() => {
                  setQuery(item);
                  scrollToId("composer");
                }}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs leading-5 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 disabled:cursor-default"
              >
                <Clock3 size={14} className="mt-0.5 shrink-0 text-zinc-700" />
                {item}
                <span className="ml-auto text-[10px] text-zinc-700">{i ? `${i}d` : "now"}</span>
              </button>
            ))}
          </div>
        </aside>

        <section id="workspace" className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-[1080px]">
            <div className="mb-10">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  {greeting}, {user.nickname}
                  <span className="text-cyan-300">.</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                  Turn a question into a defensible point of view. Your research team is ready.
                </p>
              </div>
            </div>

            <div
              id="composer"
              className="relative mb-10 overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/[0.09] via-[#10151b] to-[#111016] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] sm:p-8"
            >
              <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-300/[0.08] blur-3xl" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-300/15 text-cyan-300">
                      <Search size={14} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">
                      Start an investigation
                    </span>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 font-mono text-[10px] text-cyan-300">
                    4 AGENTS READY
                  </span>
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[82px] w-full resize-none bg-transparent text-lg leading-8 text-white outline-none placeholder:text-zinc-600 sm:text-xl"
                  placeholder="What do you want to understand?"
                />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-5">
                  <div className="flex items-center gap-2 text-xs text-zinc-500"></div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-[10px] text-zinc-600 sm:inline">{connection}</span>
                    <button
                      onClick={runResearch}
                      disabled={running || !query.trim()}
                      className="flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
                    >
                      {running ? "Running pipeline..." : "Run Research"} <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div id="pipeline" className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Your research pipeline</h2>
                  <p className="mt-1 text-xs text-zinc-600">
                    Live status from each LangGraph node.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-zinc-600">LANGGRAPH / CORE</span>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  const done = completedSteps[i];
                  const active = running && activeStep === i;
                  return (
                    <div
                      key={step.label}
                      className={`relative rounded-xl border p-4 transition-all duration-500 ${done || active ? "border-cyan-300/30 bg-cyan-300/[0.06]" : "border-white/[0.08] bg-white/[0.02]"}`}
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-lg ${done ? "bg-cyan-300 text-black" : active ? "bg-cyan-300/30 text-cyan-200" : "bg-white/[0.06] text-zinc-600"}`}
                        >
                          {done ? <Check size={16} /> : <Icon size={16} />}
                        </div>
                        <span
                          className={`font-mono text-[10px] ${done || active ? "text-cyan-300" : "text-zinc-700"}`}
                        >
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-zinc-200">{step.label}</h3>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        {active ? "Running now..." : done ? "Complete" : step.caption}
                      </p>
                      {i < 3 && (
                        <div
                          className={`absolute -right-3 top-8 hidden h-px w-3 lg:block ${completedSteps[i] ? "bg-cyan-300/60" : "bg-white/10"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div id="sources">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Source intelligence</h2>
                    <p className="mt-1 text-xs text-zinc-600">
                      {findings
                        ? "Sources extracted by the contextual retriever."
                        : "Waiting for the retriever to find sources."}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {sourceCards.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-xs text-zinc-600">
                      No sources yet. Run research to populate this section from the LLM retriever.
                    </div>
                  ) : (
                    sourceCards.map((source) => (
                      <div
                        key={source.title}
                        className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                      >
                        <div
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${source.color === "blue" ? "bg-blue-400/10 text-blue-300" : source.color === "violet" ? "bg-violet-400/10 text-violet-300" : "bg-amber-400/10 text-amber-300"}`}
                        >
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-mono text-[9px] text-zinc-600">
                              {source.type}
                            </span>
                            <span className="text-[10px] text-zinc-700">·</span>
                            <span className="text-[10px] text-zinc-600">
                              Relevance {source.score}
                            </span>
                          </div>
                          <p className="truncate text-xs font-medium text-zinc-300">
                            {source.title}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-600">{source.meta}</p>
                        </div>
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-300 hover:text-cyan-200"
                            aria-label={`Open ${source.title}`}
                          >
                            <ArrowUpRight size={15} />
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-700">No link shared</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div id="report">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">{reportTitle}</h2>
                    <p className="mt-1 text-xs text-zinc-600">
                      {connection.includes("Live")
                        ? "Updated from the latest completed run."
                        : "The next completed run will appear here."}
                    </p>
                  </div>
                </div>
                <article className="rounded-xl border border-white/[0.08] bg-[#0d1014] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[9px] text-emerald-300">
                      {connection.includes("Live") ? "READY TO READ" : "AWAITING RUN"}
                    </span>
                    <span className="text-[10px] text-zinc-700">
                      {connection.includes("Live") ? "just now" : "not run yet"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">{reportTitle}</h3>
                  <p className="mt-3 whitespace-pre-line text-xs leading-5 text-zinc-500">
                    {report}
                  </p>
                </article>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-violet-300/10 text-violet-300">
                    <BookOpen size={13} />
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">
                    Run the real graph locally
                  </span>
                </div>
                <p className="max-w-xl text-xs leading-5 text-zinc-600">
                  The dashboard mirrors the journey. The included{" "}
                  <span className="font-mono text-zinc-400">agent.py</span> runs the same four nodes
                  with LangGraph and works offline without an API key.
                </p>
              </div>
              <code className="shrink-0 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-[10px] text-cyan-300">
                python3 agent.py &quot;your question&quot;
              </code>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
