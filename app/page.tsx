'use client';

import { useState } from 'react';
import { ArrowUpRight, BookOpen, Check, ChevronDown, Clock3, FileText, Globe2, Layers3, Lightbulb, Menu, MoreHorizontal, Network, PanelLeft, Plus, Search, Settings2, Sparkles, Users2, X, Zap } from 'lucide-react';

const steps = [
  { key: 'retrieve', label: 'Contextual Retriever', caption: 'Gathering sources', icon: Search },
  { key: 'analyze', label: 'Critical Analysis', caption: 'Validating findings', icon: Network },
  { key: 'insight', label: 'Insight Generation', caption: 'Connecting patterns', icon: Lightbulb },
  { key: 'report', label: 'Report Builder', caption: 'Compiling your brief', icon: FileText },
];

const sources = [
  { type: 'PAPER', title: 'The State of Multi-Agent Systems', meta: 'ACM Digital Library · 2024', score: '98%', color: 'blue', url: 'https://scholar.google.com/' },
  { type: 'REPORT', title: 'AI Index Report 2024', meta: 'Stanford HAI · 2024', score: '94%', color: 'violet', url: 'https://aiindex.stanford.edu/' },
  { type: 'NEWS', title: 'Why agentic workflows are taking off', meta: 'The Verge · 3 days ago', score: '89%', color: 'amber', url: 'https://news.google.com/' },
];

export default function Home() {
  const [query, setQuery] = useState('How are multi-agent systems changing knowledge work?');
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [findings, setFindings] = useState('');
  const [sourceCards, setSourceCards] = useState<Array<(typeof sources)[number]>>([]);
  const [showAllSources, setShowAllSources] = useState(false);
  const [runHistory, setRunHistory] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState('No completed investigation yet');
  const [activeSection, setActiveSection] = useState('workspace');
  const [report, setReport] = useState('A concise synthesis of how multi-agent architectures are changing the way teams investigate, decide, and create.');
  const [connection, setConnection] = useState('Start the local agent bridge to run this question for real.');

  function scrollToId(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function runResearch() {
    if (running) return;
    setRunning(true); setActiveStep(-1); setCompletedSteps([false, false, false, false]); setFindings(''); setSourceCards([]); setShowAllSources(false); setConnection('Connecting to agent.py...');
    try {
      const response = await fetch('http://127.0.0.1:8787/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: query }) });
      if (!response.ok) throw new Error('Agent bridge is not ready');
      if (!response.body) throw new Error('Agent did not return a live stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
        const events = buffer.split('\n\n'); buffer = events.pop() || '';
        for (const eventText of events) {
          const line = eventText.split('\n').find((item) => item.startsWith('data: '));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as { type: string; index?: number; status?: string; message?: string; content?: string; report?: string; question?: string; sources?: Array<{ type: string; title: string; meta: string; score: string; url: string }> };
          if (event.type === 'step' && typeof event.index === 'number') {
            setActiveStep(event.index); setConnection(event.message || 'Agent step updated');
            if (event.index === 0 && event.status === 'complete') {
              const liveFindings = event.content || '';
              setFindings(liveFindings);
              if (event.sources?.length) setSourceCards(event.sources.map((source, index) => ({ ...source, color: sources[index % sources.length].color })));
            }
            if (event.status === 'complete') setCompletedSteps((previous) => previous.map((done, index) => done || index === event.index));
          }
          if (event.type === 'complete') {
            const completedQuestion = event.question || query;
            setReport(event.report || 'The agent completed without a report.'); setReportTitle(`Research brief · ${completedQuestion}`);
            setRunHistory((previous) => [completedQuestion, ...previous.filter((item) => item !== completedQuestion)].slice(0, 4));
            setCompletedSteps([true, true, true, true]); setActiveStep(3); setConnection('Live agent connected · report refreshed');
            // This is the explicit completion callback from agent.py. Do not
            // wait for the streaming HTTP connection to close before re-enabling.
            setRunning(false);
          }
        }
        if (chunk.done) break;
      }
    } catch {
      setConnection('Agent bridge unavailable · run `python3 agent.py --serve` for live Python results');
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-zinc-100 selection:bg-cyan-300 selection:text-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#08090c]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white lg:hidden" aria-label="Toggle navigation"><Menu size={20} /></button><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300 text-[#08090c] shadow-[0_0_26px_rgba(103,232,249,0.22)]"><Sparkles size={18} strokeWidth={2.5} /></div><span className="font-mono text-sm font-bold tracking-tight">RESEARCHER<span className="text-cyan-300">.</span></span></div>
          <div className="hidden items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.025] p-1 md:flex"><button onClick={() => scrollToId('workspace')} className="rounded-md bg-white/[0.08] px-4 py-2 text-xs font-medium text-white">Workspace</button><button onClick={() => scrollToId('pipeline')} className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-200">Activity</button></div>
          <div className="flex items-center gap-3"><button className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white sm:flex"><Users2 size={14} /> Invite</button><div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-pink-400 text-xs font-bold text-black">AR</div></div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px] pt-[74px]">
        <aside className={`${sidebarOpen ? 'fixed inset-y-[74px] left-0 z-40 flex w-[250px] bg-[#0b0d11] shadow-2xl' : 'hidden'} w-[250px] shrink-0 border-r border-white/[0.07] px-5 py-7 lg:flex lg:flex-col`}>
          <div className="mb-7 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Workspace</span><button className="text-zinc-600 hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)}><X size={16} /></button></div>
          <button onClick={() => { setQuery(''); scrollToId('composer'); }} className="mb-7 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 py-3 text-xs font-bold text-black transition hover:bg-cyan-200"><Plus size={15} /> New investigation</button>
          <nav className="space-y-1 text-sm">{[ ['Overview', PanelLeft, 'workspace'], ['My investigations', BookOpen, 'report'], ['Source library', Layers3, 'sources'] ].map(([name, Icon, target]) => <button onClick={() => scrollToId(target as string)} key={name as string} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${activeSection === target ? 'bg-white/[0.07] text-white' : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'}`}><Icon size={16} />{name as string}{target === 'report' && <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">{runHistory.length}</span>}{target === 'sources' && findings && <span className="ml-auto rounded bg-cyan-300/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">LIVE</span>}</button>)}</nav>
          <div className="my-8 h-px bg-white/[0.07]" /><span className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Recent runs · {runHistory.length}</span>
          <div className="space-y-1">{(runHistory.length ? runHistory : ['No completed runs yet']).map((item, i) => <button key={item} disabled={!runHistory.length} onClick={() => { setQuery(item); scrollToId('composer'); }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-xs leading-5 text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 disabled:cursor-default"><Clock3 size={14} className="mt-0.5 shrink-0 text-zinc-700" />{item}<span className="ml-auto text-[10px] text-zinc-700">{i ? `${i}d` : 'now'}</span></button>)}</div>
          <div className="mt-auto space-y-1 border-t border-white/[0.07] pt-5"><button className="flex w-full items-center gap-3 px-3 py-2 text-xs text-zinc-500 hover:text-white"><Settings2 size={15} /> Settings</button><button className="flex w-full items-center gap-3 px-3 py-2 text-xs text-zinc-500 hover:text-white"><Zap size={15} /> Usage <span className="ml-auto text-cyan-300">68%</span></button></div>
        </aside>

        <section id="workspace" className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-12"><div className="mx-auto max-w-[1080px]">
          <div className="mb-10 flex items-end justify-between gap-4"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">{'// workspace / overview'}</p><h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Good morning, Anu<span className="text-cyan-300">.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Turn a question into a defensible point of view. Your research team is ready.</p></div><button className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/5 hover:text-white sm:flex"><MoreHorizontal size={16} /> Options</button></div>

          <div id="composer" className="relative mb-10 overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/[0.09] via-[#10151b] to-[#111016] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] sm:p-8"><div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-300/[0.08] blur-3xl" /><div className="relative"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-300/15 text-cyan-300"><Search size={14} /></div><span className="text-xs font-semibold text-zinc-200">Start an investigation</span></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 font-mono text-[10px] text-cyan-300">4 AGENTS READY</span></div><textarea value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-[82px] w-full resize-none bg-transparent text-lg leading-8 text-white outline-none placeholder:text-zinc-600 sm:text-xl" placeholder="What do you want to understand?" /><div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-5"><div className="flex items-center gap-2 text-xs text-zinc-500"><Globe2 size={14} className="text-zinc-600" /> Multi-source <ChevronDown size={13} /></div><div className="flex items-center gap-3"><span className="hidden text-[10px] text-zinc-600 sm:inline">{connection}</span><button onClick={runResearch} disabled={running || !query.trim()} className="flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-2.5 text-xs font-bold text-black transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70">{running ? 'Running pipeline...' : 'Run Research'} <ArrowUpRight size={15} /></button></div></div></div></div>

          <div id="pipeline" className="mb-10"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">Your research pipeline</h2><p className="mt-1 text-xs text-zinc-600">Live status from each LangGraph node.</p></div><span className="font-mono text-[10px] text-zinc-600">LANGGRAPH / CORE</span></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{steps.map((step, i) => { const Icon = step.icon; const done = completedSteps[i]; const active = running && activeStep === i; return <div key={step.label} className={`relative rounded-xl border p-4 transition-all duration-500 ${done || active ? 'border-cyan-300/30 bg-cyan-300/[0.06]' : 'border-white/[0.08] bg-white/[0.02]'}`}><div className="mb-5 flex items-center justify-between"><div className={`grid h-8 w-8 place-items-center rounded-lg ${done ? 'bg-cyan-300 text-black' : active ? 'bg-cyan-300/30 text-cyan-200' : 'bg-white/[0.06] text-zinc-600'}`}>{done ? <Check size={16} /> : <Icon size={16} />}</div><span className={`font-mono text-[10px] ${done || active ? 'text-cyan-300' : 'text-zinc-700'}`}>0{i + 1}</span></div><h3 className="text-xs font-semibold text-zinc-200">{step.label}</h3><p className="mt-1 text-[11px] text-zinc-600">{active ? 'Running now...' : done ? 'Complete' : step.caption}</p>{i < 3 && <div className={`absolute -right-3 top-8 hidden h-px w-3 lg:block ${completedSteps[i] ? 'bg-cyan-300/60' : 'bg-white/10'}`} />}</div> })}</div></div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div id="sources"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">Source intelligence</h2><p className="mt-1 text-xs text-zinc-600">{findings ? 'Live sources extracted by the contextual retriever.' : 'Waiting for the retriever to find sources.'}</p></div>{sourceCards.length > 3 && <button onClick={() => setShowAllSources(!showAllSources)} className="text-xs text-cyan-300 hover:text-cyan-200">{showAllSources ? 'Collapse' : 'View all'} <ArrowUpRight size={13} className="inline" /></button>}</div><div className="space-y-2">{sourceCards.length === 0 ? <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-xs text-zinc-600">No sources yet. Run research to populate this section from the LLM retriever.</div> : sourceCards.slice(0, showAllSources ? sourceCards.length : 3).map((source) => <div key={source.title} className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-white/20"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${source.color === 'blue' ? 'bg-blue-400/10 text-blue-300' : source.color === 'violet' ? 'bg-violet-400/10 text-violet-300' : 'bg-amber-400/10 text-amber-300'}`}><FileText size={16} /></div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className="font-mono text-[9px] text-zinc-600">{source.type}</span><span className="text-[10px] text-zinc-700">·</span><span className="text-[10px] text-zinc-600">Relevance {source.score}</span></div><p className="truncate text-xs font-medium text-zinc-300 group-hover:text-white">{source.title}</p><p className="mt-1 text-[11px] text-zinc-600">{source.meta}</p></div>{source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="text-zinc-700 hover:text-white" aria-label={`Open ${source.title}`}><ArrowUpRight size={15} /></a> : <span className="text-[10px] text-zinc-700">No verified link</span>}</div>)}</div></div>
            <div id="report"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">{reportTitle}</h2><p className="mt-1 text-xs text-zinc-600">{connection.includes('Live') ? 'Updated from the latest completed run.' : 'The next completed run will appear here.'}</p></div><button onClick={() => scrollToId('report')} className="text-zinc-600 hover:text-white"><MoreHorizontal size={17} /></button></div><article className="rounded-xl border border-white/[0.08] bg-[#0d1014] p-5"><div className="mb-5 flex items-center justify-between"><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[9px] text-emerald-300">{connection.includes('Live') ? 'READY TO READ' : 'AWAITING RUN'}</span><span className="text-[10px] text-zinc-700">{connection.includes('Live') ? 'just now' : 'not run yet'}</span></div><h3 className="text-lg font-semibold tracking-tight text-white">{reportTitle}</h3><p className="mt-3 whitespace-pre-line text-xs leading-5 text-zinc-500">{report}</p><div className="my-5 h-px bg-white/[0.07]" /><div className="flex items-center justify-between"><div className="flex -space-x-2"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0d1014] bg-cyan-300 text-[9px] font-bold text-black">CR</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0d1014] bg-violet-300 text-[9px] font-bold text-black">CA</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0d1014] bg-orange-300 text-[9px] font-bold text-black">IG</span></div><button onClick={() => scrollToId('report')} className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-2 text-[11px] font-semibold text-zinc-200 hover:bg-white/10">Open report <ArrowUpRight size={13} /></button></div></article></div>
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-violet-300/10 text-violet-300"><BookOpen size={13} /></span><span className="text-xs font-semibold text-zinc-200">Run the real graph locally</span></div><p className="max-w-xl text-xs leading-5 text-zinc-600">The dashboard mirrors the journey. The included <span className="font-mono text-zinc-400">agent.py</span> runs the same four nodes with LangGraph and works offline without an API key.</p></div><code className="shrink-0 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-[10px] text-cyan-300">python3 agent.py &quot;your question&quot;</code></div>
        </div></section>
      </div>
    </main>
  );
}
