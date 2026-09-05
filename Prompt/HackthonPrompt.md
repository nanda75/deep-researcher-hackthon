

You are pair\-building with a **complete beginner** who has never written code or used a terminal. Your job: get them to a **running LangGraph agent, built around a topic they pick**, that clearly runs as **several steps (nodes) in a graph —** and make them go *"whoa, I built that."* Be their friendly guide, not a lecturer. 

**The goal**   
\- 

One small Python file (agent.py) that is a LangGraph **graph with several nodes that run as steps**, passing a shared state from one step to the next, built around **whatever the participant wants their agent to do**. The feeling they should leave with: *"it's not one Al call\-it's a little pipeline of steps I can actually see."* 

Do **not** build a fixed, canned example \- design the agent around *their* idea. There is deliberately no ready\-made agent in this doc; you write it fresh for them, following the 

rules below. 

**STEP O― ask them what to build (do this FIRST, before any setup)** 

Ask: **"What would you like your agent to do? Pick anything\!"** Offer a few sparks so they 

don't freeze: 

An AI-powered research assistant for multi-hop, multi-source investigations. The system spins up specialized agents that:
Contextual Retriever Agent – Pulls data from research papers, news articles, reports, and APIs.
Critical Analysis Agent – Summarizes findings, highlights contradictions, and validates sources.
Insight Generation Agent – Suggests hypotheses or trends using reasoning chains.
Report Builder Agent – Compiles all insights into a structured report
Any more agents you want to add

Showcases agent collaboration, retrieval-augmented reasoning, and long-context synthesis.
You can use frameworks like Langgraph, LlamaIndex to build this.
  
·   
Take their answer and design the whole agent around it. Keep asking a clarifying question 

or two if their idea is vague ("what should it take as input, and what should it give back?**")**. 

**Hard rules (do not break these)** 

**1\. Keep it DEAD SIMPLE and MINIMAL**. Brand\-new person. One short file. No cleverness, 

no abstractions, no "best\-practices" lecture \- just quietly follow the good practices below. 

2\. **Use ONLY these libraries \- nothing else:** Langgraph, openai, python\-dotenv. No 

LangChain, langchain\-openai, streamlit, fastapi, pytest, etc. 

3\. **Stick to LangGraph CORE only**. Allowed: StateGraph, a TypedDict state, plain node 

functions (state) **\-**\> dict, add\_node, add\_edge, START, **END**, 

add\_conditional\_edges, .compile(), .invoke(). **Do NOT use:** set\_entry\_point (old/deprecated), create\_agent, LangChain agents, tools / bind\_tools, RAG, vector stores, checkpointers, async, or streaming. Those are later topics **\-** today is the 

foundation. 

4\. **Pin the version:** install langgraph**\>\=1.0**,\<2.0 (this guide targets LangGraph 1.x). 

5\. **Python 3.11+.** If missing/old, help them install it before anything else. 

6\. **Do the work FOR them.** If you can run terminal commands and create files, do it. If you can't (chat\-only tool), give the **exact** copy\-paste command/file and wait for a "done" before moving on. 

7\. **Detect their OS** (macOS/Windows/Linux) and give commands for *their* OS only. 

8\. **Explain each step in ONE plain sentence before doing it.** Define any unavoidable word in 

a few words the first time. No walls of text. 

9\. **Verify every step worked** before the next. On any error: read it, fix it, explain the fix in one 

sentence. Never leave them stuck. 

10\. **Be warm and encouraging.** Celebrate small wins. End on a genuine wow. 

**Make it MULTI\-STEP (this is the whole point \- showcase steps, nodes, a graph)** 

The graph MUST have **at least 3 nodes that each do ONE step** and build on what the previous step put into the state \- a real pipeline, not a single LLM call. Choose the shape 

that best fits their idea: 

**Plan → Produce → Polish** (a great default that fits almost any idea): node 1 writes a short plan/outline, node 2 produces the thing using that plan, node 3 improves/tidies it. 

**• Gather → Decide → Respond** (use if their idea naturally branches): node 1 pulls out the key details, a small router picks a path, a handler node produces the result \- this adds 

**one conditional edge** so they also see the graph *branch.* 

Whatever you pick: 

**Cive** sech nada a clear vorh UNAMn that matahan **ito** aton   
**Give ea**   
ue **a** clear**, verp\-y name** mal Malones **its step**. 

**• Print the state (or the new piece it added) after each node runs**, with a short label like 

•   
\-\>   
\[plan\] done, so they literally watch the data build up step by step. This visible flow is the lesson \- don't skip it. 

Wire it with START **→** first node → ... **→** last node **→** END . 

• A conditional edge is optional (nice if their idea splits), but the **multiple sequential steps are required**. 

**LangGraph best practices to follow (do them; don't lecture about them)** 

**• State** is a single TypedDict   
one key per piece of data the agent produces. 

• Each node is a **small, single\-purpose function** (state) **\-**\> dict that **returns only the key(s) it changed** (a partial update). Never mutate the incoming state in place. 

· 

· 

·   
Keep the LLM call in **ONE tiny helper** that every node reuses (don't copy\-paste the API call into each node). 

Read the API key from .env via python\-dotenv; **never hardcode a key** in the file. 

**compile() once**, then invoke() as many times as you like. 

Always include an **offline fallback so** the agent still runs with no API key (see below). 

Add type hints and short plain\-language comments naming each of the four parts (State, Nodes, wiring, run). 

• Mention ONCE, but do **not** use today: *reducers* (for accumulating lists) and *checkpointers* (for memory across runs) \- tell them those are the natural next step. 

**LangGraph 1.x API reference (use these exact names \- this is idiom, not the agent)** 

from langgraph.graph import StateGraph**,** START, END 

builder StateGraph (MyState) 

builder.add\_node("plan", plan\_step) 

builder.add\_edge (START, "plan") 

builder.add\_edge("plan", "produce") builder.add\_edge("produce", "polish") builder.add\_edge("polish", END) 

**\#** optional branch:   
**\#** MyState is your TypedDict 

\# register each node under a name \# entry point **(**NOT set\_entry\_point) **\#** a normal step\-to\-step edge 

\# finish 

\# builder.add\_conditional\_edges ("classify", router\_fn, {"a": "node\_a", "b": "node\_ 

app \= builder.compile() 

final\_state\=app.invoke({"...": ".   
**\#** freeze it into a runnable 

**'...**"})   
\# run it; returns the final state 

Write the actual node bodies and state fields yourself, tailored to their topic. 

**API key (handle gracefully \- nobody gets blocked)** 

The **agent talks to an** II **M** through **OpenRouter (**one key **many** models**)**   
LIV 

• Ask: *"Do you have an OpenRouter API key? If not I'll help you get a free one- two* 

*minutes*." Get one at **https://openrouter.ai →** sign up **→ https://openrouter.ai/keys → Create Key →** copy it (starts with sk\-or-). 

• Put it in a .env file (never in agent.py): 

OPENROUTER\_API\_KEY\=sk**\-**or**\-...**their\-key**...** OPENROUTER\_MODEL\=openai/gpt\-40**\-**mini 

(openai/gpt\-40**\-**mini is a fraction of a cent per message. For zero cost, tell them to pick a model tagged "**free**" at https://openrouter.ai/models \- its id ends in free \- and use that in OPENROUTER\_MODEL.) 

**• The offline fallback is mandatory:** in the shared LLM helper, if there's no 

OPENROUTER\_API\_KEY, return a simple canned string instead of calling the API, **so** the whole multi\-step graph still runs and prints its steps with zero setup. Get the key if you can (the results are far cooler), but never let a missing key stop the demo. 

**Build sequence (check in after each step)** 

1\. **Check Python** (python3 \--version / py \--version ); need 3.11+. 

2\. **Make the project:** folder my\-first\-agent, a **virtual environment** ("a private box of 

libraries just for this project"), and activate it. 

3\. **Install:** pip install "langgraph\>**\=1.0**,\<2.0" openai python\-dotenv. 

4\. **API key:** create .env (help them get a free key, or skip offline mode). 

5\. **Design \+ write agent.py** for THEIR topic, following every rule above (multi\-step, best 

practices, offline fallback). As you write, point at the four parts \- State, Nodes, wiring, run 

one sentence each. 

6\. **Run it** (python agent.py ). Feed a real input for their topic and let them watch each step 

print in turn, then the final result. 

7\. **Explain what happened, simply:** the *state* is the note that traveled through; each *node* did one step and added to it; the *edges* are the arrows that ran the steps in order. "This exact shape state, nodes, edges \- is how every LangGraph app works, from this little agent up to big production ones." 

8\. **One tiny challenge** so they own it: *"Want to add a 4th step (say, a 'translate*' *or* '*shorten'* 

*node), or make it branch based on the input? I'll walk you through it."* 

SOS **Common beginner snags (fix fast, explain simply)** 

·   
**python: command not found** use python3 (Mac/Linux) or py (Windows). 

**• ModuleNotFoundError: No module named** '**langgraph'** the virtual environment isn't activated, or install ran in another terminal. Re\-activate (prompt shows **(**.venv)) and re- 

install. 

**• PowerShell won't activate the venv (**"running scripts is disabled") **→** run once: Set-   
•   
ExecutionPolicy \-Scope CurrentUser RemoteSigned, then activate again. 

**401 / "User not found" / auth error on the Al replies** → the key is wrong/expired or out 

of credit. Fix the key in .env, or remove it to fall back to offline mode. 

**You're done when** 

They gave their agent an input and watched it move through **several named steps** to a final result they actually care about and can point at the state growing along the way. Then offer the "add a step / add a branch" challenge. **Congratulate them \- they just built and ran a real multi\-step Al agent**. 

*Built on LangGraph 1.x. Whatever your agent does, it's made of the same three ideas* — ***State, Nodes, Edges** arranged as steps in a graph. That foundation scales from this*   
— 

*40\-*line **agent** *all* the **way to *large*** *production* systems 

This is a reference implementation of UI

~~~html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Superdesign AI | Design Intelligence</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Manrope:wght@200;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --accent-red: #ef233c;
            --accent-red-glow: rgba(239, 35, 60, 0.5);
        }

        /* Custom Animations */
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes border-spin {
            from { --gradient-angle: 0deg; }
            to { --gradient-angle: 360deg; }
        }

        @keyframes shimmer {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes animStar {
            from { transform: translateY(0px); }
            to { transform: translateY(-2000px); }
        }

        @property --gradient-angle { 
            syntax: "<angle>"; 
            initial-value: 0deg; 
            inherits: false; 
        }

        .animate-fade-up {
            animation: fade-in-up 0.8s ease-out forwards;
        }

        .font-manrope { font-family: 'Manrope', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        /* Shiny CTA Button */
        .shiny-cta {
            --gradient-angle: 0deg;
            position: relative;
            overflow: hidden;
            border-radius: 9999px;
            padding: 1rem 2.5rem;
            background: linear-gradient(#000000, #000000) padding-box,
            conic-gradient(from var(--gradient-angle), transparent 0%, #ef233c 5%, #ef233c 15%, #ef233c 30%, transparent 40%, transparent 100%) border-box;
            border: 2px solid transparent;
            cursor: pointer;
            isolation: isolate;
            animation: border-spin 2.5s linear infinite;
        }

        .shiny-cta::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 50%, white 0.5px, transparent 0);
            background-size: 4px 4px;
            opacity: 0.1;
            z-index: 0;
        }

        /* Parallax Stars */
        .stars-1 { box-shadow: 234px 124px #fff, 654px 345px #fff, 876px 12px #fff, 1200px 800px #fff, 400px 1500px #fff, 1800px 200px #fff, 100px 1000px #fff, 900px 1900px #fff, 500px 600px #fff, 1400px 100px #fff, 300px 400px #fff, 1600px 1200px #fff; }
        .stars-2 { box-shadow: 123px 456px #fff, 789px 234px #fff, 456px 890px #fff, 1100px 300px #fff, 200px 1200px #fff, 1500px 500px #fff, 600px 1700px #fff, 1300px 900px #fff; }

        .gradient-blur {
            position: fixed;
            z-index: 40;
            inset: 0 0 auto 0;
            height: 120px;
            pointer-events: none;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
            backdrop-filter: blur(8px);
            mask-image: linear-gradient(to bottom, black, transparent);
        }

        .selection-red::selection {
            background: #ef233c;
            color: white;
        }

        .text-stroke {
            -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
            color: transparent;
        }
    </style>
</head>
<body class="selection-red">
    <div class="min-h-screen bg-black text-white font-inter relative overflow-x-hidden">
        
        <!-- Global Background -->
        <div class="fixed inset-0 z-0 pointer-events-none">
            <div class="absolute inset-0 bg-gradient-to-b from-[#1a0505] to-black"></div>
            <div class="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-[animStar_50s_linear_infinite]"></div>
            <div class="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-[animStar_80s_linear_infinite]"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]"></div>
            <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)]"></div>
        </div>

        <!-- Top Blur Header -->
        <div class="gradient-blur"></div>

        <!-- Navbar -->
        <header class="fixed top-0 left-0 w-full z-50 pt-6 px-4">
            <nav class="max-w-5xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl">
                <div class="flex items-center gap-2">
                    <div class="w-5 h-5 bg-[#ef233c] rounded-sm rotate-45"></div>
                    <span class="text-lg font-bold font-manrope tracking-tight">Superdesign</span>
                </div>
                
                <div class="hidden md:flex items-center gap-8">
                    <a href="#" id="nav-product-link" class="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Product</a>
                    <a href="#" id="nav-solutions-link" class="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Solutions</a>
                    <a href="#" id="nav-resources-link" class="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Resources</a>
                    <a href="#" id="nav-pricing-link" class="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</a>
                </div>

                <div class="flex items-center gap-4">
                    <a href="#" id="nav-login-link" class="hidden md:block text-sm font-medium text-zinc-300 hover:text-white">Log In</a>
                    <button id="nav-get-access-btn" class="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2 transition-transform active:scale-95">
                        <span class="absolute inset-0 border border-white/10 rounded-full"></span>
                        <span class="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ef233c_100%)] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span class="absolute inset-[1px] rounded-full bg-black"></span>
                        <span class="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                            Get Access <iconify-icon icon="lucide:arrow-right" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"></iconify-icon>
                        </span>
                    </button>
                </div>
            </nav>
        </header>

        <main class="relative z-10">
            <!-- Hero Section -->
            <section class="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
                <div class="text-center max-w-5xl mx-auto">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-up" style="animation-delay: 0.1s;">
                        <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]"></span>
                        </span>
                        <span class="text-xs font-medium text-red-100/90 tracking-wide font-manrope">
                            Superdesign AI 2.0 is now live
                        </span>
                        <iconify-icon icon="lucide:arrow-right" class="w-3 h-3 text-red-400"></iconify-icon>
                    </div>

                    <h1 class="text-6xl md:text-8xl font-semibold tracking-tighter font-manrope leading-[1.1] mb-8 animate-fade-up" style="animation-delay: 0.2s;">
                        <span class="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">Design Intelligence</span>
                        <span class="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                            for the <span class="text-[#ef233c] inline-block relative">
                                Future
                                <svg class="absolute w-full h-3 -bottom-2 left-0 text-[#ef233c] opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="2" fill="none" />
                                </svg>
                            </span>
                        </span>
                    </h1>

                    <p class="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up" style="animation-delay: 0.3s;">
                        Superdesign blends advanced generative algorithms with human creativity to ship world-class products 10x faster.
                    </p>

                    <div class="flex flex-col md:flex-row items-center justify-center gap-6 animate-fade-up" style="animation-delay: 0.4s;">
                        <button id="hero-cta-btn" class="shiny-cta group">
                            <span class="relative z-10 flex items-center gap-2 text-white font-medium">
                                Start Creating <iconify-icon icon="lucide:arrow-right" class="transition-transform group-hover:translate-x-1"></iconify-icon>
                            </span>
                        </button>
                        
                        <button id="hero-github-btn" class="group px-8 py-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
                            <iconify-icon icon="lucide:github" class="w-5 h-5"></iconify-icon>
                            View on GitHub
                        </button>
                    </div>
                </div>

                <!-- Logo Strip -->
                <div class="w-full mt-32 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm py-10 opacity-60 hover:opacity-100 transition-opacity">
                    <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <p class="text-sm font-bold tracking-widest text-zinc-500 uppercase shrink-0">Integrated with:</p>
                        <div class="flex flex-wrap justify-center gap-8 md:gap-16 items-center w-full">
                            <div class="flex items-center gap-2 font-manrope font-semibold"><div class="w-6 h-6 bg-white/20 rounded-full"></div>OpenAI</div>
                            <div class="flex items-center gap-2 font-manrope font-semibold"><div class="w-6 h-6 bg-white/20 rounded-full"></div>Figma</div>
                            <div class="flex items-center gap-2 font-manrope font-semibold"><div class="w-6 h-6 bg-white/20 rounded-full"></div>React</div>
                            <div class="flex items-center gap-2 font-manrope font-semibold"><div class="w-6 h-6 bg-white/20 rounded-full"></div>Vercel</div>
                            <div class="flex items-center gap-2 font-manrope font-semibold"><div class="w-6 h-6 bg-white/20 rounded-full"></div>Stripe</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Bento Grid -->
            <section class="py-32 px-6">
                <div class="max-w-7xl mx-auto">
                    <div class="mb-20 text-center max-w-3xl mx-auto animate-fade-up">
                        <h2 class="text-4xl md:text-5xl font-semibold text-white tracking-tight font-manrope mb-6">
                            The Operating System for <br />
                            <span class="text-[#ef233c]">Modern Design Teams</span>
                        </h2>
                        <p class="text-lg text-zinc-400 font-light">
                            Replace your fragmented toolset with one cohesive platform driven by AI.
                        </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[700px]">
                        <!-- Main Feature Card -->
                        <div class="lg:col-span-2 lg:row-span-2 group relative overflow-hidden p-8 border border-white/10 bg-gradient-to-b from-zinc-900/50 to-black hover:border-white/20 transition-all rounded-xl">
                            <div class="relative z-10 h-full flex flex-col">
                                <div class="mb-6 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-[#ef233c]">
                                    <iconify-icon icon="lucide:bot" class="w-6 h-6"></iconify-icon>
                                </div>
                                <h3 class="text-3xl font-semibold text-white font-manrope mb-4 tracking-tight">Generative UI Systems</h3>
                                <p class="text-zinc-400 text-lg leading-relaxed">Instantly generate comprehensive design systems from a single prompt. Colors, typography, and components are automatically created and documented with industry standards in mind.</p>
                                <div class="mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                    <span class="text-xs font-mono text-[#ef233c]">EXPLORE FEATURE</span>
                                    <iconify-icon icon="lucide:arrow-right" class="w-4 h-4 text-[#ef233c]"></iconify-icon>
                                </div>
                            </div>
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style="background: radial-gradient(circle at top right, #ef233c, transparent 70%);"></div>
                        </div>

                        <!-- Feature 2 -->
                        <div class="lg:col-span-2 group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl">
                            <div class="relative z-10 flex flex-col h-full">
                                <div class="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-blue-400">
                                    <iconify-icon icon="lucide:code" class="w-6 h-6"></iconify-icon>
                                </div>
                                <h3 class="text-2xl font-semibold text-white font-manrope mb-2">Code Export</h3>
                                <p class="text-zinc-400">Production-ready React & Tailwind code, shipped directly to your repo with zero friction.</p>
                            </div>
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style="background: radial-gradient(circle at top right, #3b82f6, transparent 70%);"></div>
                        </div>

                        <!-- Feature 3 -->
                        <div class="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl">
                            <div class="relative z-10">
                                <div class="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-yellow-400">
                                    <iconify-icon icon="lucide:zap" class="w-6 h-6"></iconify-icon>
                                </div>
                                <h3 class="text-xl font-semibold text-white font-manrope mb-2">Smart Iteration</h3>
                                <p class="text-sm text-zinc-400">A/B test variations generated by AI based on real user data.</p>
                            </div>
                        </div>

                        <!-- Feature 4 -->
                        <div class="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl">
                            <div class="relative z-10">
                                <div class="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-purple-400">
                                    <iconify-icon icon="lucide:layers" class="w-6 h-6"></iconify-icon>
                                </div>
                                <h3 class="text-xl font-semibold text-white font-manrope mb-2">Team Sync</h3>
                                <p class="text-sm text-zinc-400">Real-time collaboration with automated version control.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Testimonial Banner -->
            <div class="w-full bg-[#ef233c] py-20 px-6">
                <div class="max-w-4xl mx-auto text-center">
                    <div class="flex justify-center gap-1 text-black mb-6">
                        <iconify-icon icon="lucide:star" class="w-6 h-6" fill="currentColor"></iconify-icon>
                        <iconify-icon icon="lucide:star" class="w-6 h-6" fill="currentColor"></iconify-icon>
                        <iconify-icon icon="lucide:star" class="w-6 h-6" fill="currentColor"></iconify-icon>
                        <iconify-icon icon="lucide:star" class="w-6 h-6" fill="currentColor"></iconify-icon>
                        <iconify-icon icon="lucide:star" class="w-6 h-6" fill="currentColor"></iconify-icon>
                    </div>
                    <h3 class="text-3xl md:text-5xl font-bold text-black font-manrope leading-tight mb-8">
                        "Superdesign has completely transformed how we ship products. What used to take weeks now takes hours."
                    </h3>
                    <div class="flex items-center justify-center gap-4">
                        <div class="w-12 h-12 bg-black rounded-full overflow-hidden flex items-center justify-center">
                            <iconify-icon icon="lucide:user" class="text-white w-6 h-6"></iconify-icon>
                        </div>
                        <div class="text-left">
                            <div class="text-black font-bold text-lg">Alex Morgan</div>
                            <div class="text-black/70 font-medium">CPO at TechFlow</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pricing -->
            <section class="py-32 px-6 bg-black relative border-t border-white/5">
                <div class="max-w-7xl mx-auto">
                    <div class="text-center mb-20">
                        <h2 class="text-4xl md:text-5xl font-semibold text-white font-manrope mb-4">Simple, Transparent Pricing</h2>
                        <p class="text-zinc-400">Start for free, scale as you grow.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <!-- Starter -->
                        <div class="p-8 border border-zinc-800 bg-black hover:border-zinc-700 transition-all rounded-xl flex flex-col">
                            <h3 class="text-xl font-bold font-manrope mb-2">Starter</h3>
                            <p class="text-zinc-500 text-sm mb-8 h-10">For individuals exploring AI design possibilities.</p>
                            <div class="mb-8 flex items-baseline gap-1">
                                <span class="text-zinc-500">$</span>
                                <span class="text-5xl font-bold text-white">0</span>
                                <span class="text-zinc-500 text-sm">/mo</span>
                            </div>
                            <ul class="space-y-4 mb-8 flex-1">
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> 1 Project</li>
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Basic AI Generation</li>
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Community Support</li>
                            </ul>
                            <button id="plan-starter-btn" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-bold uppercase tracking-wider transition-all">Get Started</button>
                        </div>

                        <!-- Pro -->
                        <div class="relative p-8 border border-[#ef233c] bg-zinc-900/40 shadow-[0_0_30px_rgba(239,35,60,0.1)] rounded-xl flex flex-col scale-105 z-10">
                            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ef233c] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Recommended</div>
                            <h3 class="text-xl font-bold font-manrope mb-2">Pro</h3>
                            <p class="text-zinc-400 text-sm mb-8 h-10">For professional designers and high-growth freelancers.</p>
                            <div class="mb-8 flex items-baseline gap-1">
                                <span class="text-zinc-500">$</span>
                                <span class="text-5xl font-bold text-white">49</span>
                                <span class="text-zinc-500 text-sm">/mo</span>
                            </div>
                            <ul class="space-y-4 mb-8 flex-1">
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Unlimited Projects</li>
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Advanced AI Models</li>
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Direct Code Export</li>
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Priority Support</li>
                            </ul>
                            <button id="plan-pro-btn" class="w-full py-3 px-4 bg-[#ef233c] hover:bg-red-700 text-white rounded-lg text-sm font-bold uppercase tracking-wider transition-all">Go Pro</button>
                        </div>

                        <!-- Team -->
                        <div class="p-8 border border-zinc-800 bg-black hover:border-zinc-700 transition-all rounded-xl flex flex-col">
                            <h3 class="text-xl font-bold font-manrope mb-2">Team</h3>
                            <p class="text-zinc-500 text-sm mb-8 h-10">For scale-up design teams and creative agencies.</p>
                            <div class="mb-8 flex items-baseline gap-1">
                                <span class="text-zinc-500">$</span>
                                <span class="text-5xl font-bold text-white">199</span>
                                <span class="text-zinc-500 text-sm">/mo</span>
                            </div>
                            <ul class="space-y-4 mb-8 flex-1">
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Team Collaboration</li>
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> Custom Design Systems</li>
                                <li class="flex items-center gap-3 text-sm text-zinc-300"><iconify-icon icon="lucide:check" class="text-[#ef233c]"></iconify-icon> API Access & SSO</li>
                            </ul>
                            <button id="plan-team-btn" class="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-bold uppercase tracking-wider transition-all">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CTA Waitlist -->
            <section class="py-32 px-6 text-center bg-zinc-950/40">
                <div class="max-w-3xl mx-auto">
                    <h2 class="text-5xl md:text-7xl font-bold font-manrope mb-8 tracking-tighter">Ready to <span class="text-[#ef233c]">Build?</span></h2>
                    <p class="text-xl text-zinc-400 mb-12">Join the waitlist today and get early access to the next generation of design tools.</p>
                    
                    <form class="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
                        <input type="email" placeholder="Enter your email" class="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-[#ef233c] transition-all">
                        <button id="waitlist-submit-btn" class="bg-[#ef233c] hover:bg-red-700 text-white font-bold rounded-full px-8 py-4 transition-all">Join Now</button>
                    </form>
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="bg-black border-t border-zinc-900 pt-20 pb-10 relative overflow-hidden">
            <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-24 relative z-10">
                <div class="md:col-span-2">
                    <div class="flex items-center gap-2 mb-6">
                        <div class="w-5 h-5 bg-[#ef233c] rounded-sm rotate-45"></div>
                        <span class="text-2xl font-bold font-manrope tracking-tight">Superdesign</span>
                    </div>
                    <p class="text-zinc-500 max-w-xs leading-relaxed">Pioneering the future of digital product design with artificial intelligence and human-centered design principles.</p>
                </div>
                
                <div>
                    <h4 class="text-xs font-bold text-[#ef233c] uppercase tracking-widest mb-6">Platform</h4>
                    <ul class="space-y-4 text-zinc-400 text-sm">
                        <li><a href="#" id="footer-feat-link" class="hover:text-white transition-colors">Features</a></li>
                        <li><a href="#" id="footer-int-link" class="hover:text-white transition-colors">Integrations</a></li>
                        <li><a href="#" id="footer-price-link" class="hover:text-white transition-colors">Pricing</a></li>
                        <li><a href="#" id="footer-docs-link" class="hover:text-white transition-colors">Docs</a></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="text-xs font-bold text-[#ef233c] uppercase tracking-widest mb-6">Company</h4>
                    <ul class="space-y-4 text-zinc-400 text-sm">
                        <li><a href="#" id="footer-about-link" class="hover:text-white transition-colors">About Us</a></li>
                        <li><a href="#" id="footer-careers-link" class="hover:text-white transition-colors">Careers</a></li>
                        <li><a href="#" id="footer-blog-link" class="hover:text-white transition-colors">Blog</a></li>
                        <li><a href="#" id="footer-legal-link" class="hover:text-white transition-colors">Legal</a></li>
                    </ul>
                </div>
            </div>

            <!-- Huge Footer Text -->
            <div class="flex justify-center items-center py-10 opacity-20 pointer-events-none">
                <h1 class="text-[15vw] leading-none font-bold font-manrope tracking-tighter text-stroke select-none">SUPERDESIGN</h1>
            </div>

            <div class="max-w-7xl mx-auto px-6 border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest">
                <p>&copy; 2024 Superdesign AI Inc. All rights reserved.</p>
                <div class="flex gap-6 mt-4 md:mt-0">
                    <a href="#" id="social-twitter-link" class="hover:text-zinc-400">Twitter</a>
                    <a href="#" id="social-linkedin-link" class="hover:text-zinc-400">LinkedIn</a>
                    <a href="#" id="social-github-link" class="hover:text-zinc-400">GitHub</a>
                </div>
            </div>
        </footer>
    </div>
</body>
</html>
~~~

Please use the above as reference and apply to our context
