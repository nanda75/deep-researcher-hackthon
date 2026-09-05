# Deep Researcher — Implementation Overview

## 1. Purpose

Deep Researcher is a browser-based research workspace backed by a four-stage LangGraph pipeline. A signed-in user submits a research question, watches the agent stages execute in real time, reviews extracted source intelligence, and receives a structured report. Investigation history is stored per user in SQLite, while optional LangSmith tracing provides observability into the LangChain model calls and LangGraph execution.

## 2. High-level design

```text
┌──────────────────────┐       HTTP + SSE        ┌────────────────────────┐
│ Next.js / Vinext UI  │ ──────────────────────> │ Python agent bridge    │
│ app/page.tsx         │                         │ agent.py               │
│                      │ <────────────────────── │                        │
│ Auth, live progress, │       JSON / events     │ Auth + SQLite           │
│ sources, report      │                         │ LangGraph workflow      │
└──────────┬───────────┘                         └───────────┬────────────┘
           │                                                   │
           │ external link                                    │ optional model/traces
           ▼                                                   ▼
┌──────────────────────┐                         ┌────────────────────────┐
│ LangSmith workspace  │                         │ OpenRouter via         │
│ smith.langchain.com  │                         │ LangChain ChatOpenRouter│
└──────────────────────┘                         └────────────────────────┘

                    ┌──────────────────────────────┐
                    │ Local LangGraph Studio       │
                    │ 127.0.0.1:2024/ok             │
                    └──────────────────────────────┘
```

The UI and Python bridge run as separate local processes. The UI calls the bridge at `127.0.0.1:8787`; LangGraph Studio is independently checked at `127.0.0.1:2024`. The Studio card links to the LangSmith workspace and reports whether the local Studio health endpoint is reachable.

## 3. Technical approach

### Frontend

- `app/page.tsx` is a client-side dashboard implemented with React state and Tailwind-style utility classes.
- The login screen is the initial application state. Successful registration or login creates a session and loads that user’s history.
- Research requests use `POST /run` and consume a Server-Sent Events stream.
- Each pipeline event updates the active step, completion indicators, connection message, source cards, report, and recent runs.
- The explicit final `complete` event immediately re-enables the Run research button, allowing another investigation without refreshing the page.
- A new investigation resets the question, report, source intelligence, progress state, and status message.
- Source cards are created from the Python agent response. The UI does not invent or display placeholder sources after a reset.

### Backend and workflow

`agent.py` exposes a small standard-library HTTP server and a compiled LangGraph graph:

```text
START
  ↓
retrieve → analyze → insight → report
                                      ↓
                                     END
```

Each node receives the shared `ResearchState` and returns only the state fields it produces:

1. `retrieve` asks the model for a JSON source list and validates the result.
2. `analyze` compares evidence angles and identifies contradictions or verification needs.
3. `insight` generates useful patterns or hypotheses with caveats.
4. `report` produces a structured brief with summary, evidence, caveats, and next questions.

The graph is exported as `graph` and configured in `langgraph.json` as `./agent.py:graph`, which allows LangGraph tooling and Studio to discover it.

### LangChain and LangSmith

- Model calls use LangChain’s `ChatOpenRouter` integration.
- Each call receives a meaningful `run_name` and tags such as `researcher`, `contextual_retriever`, and `report_builder`.
- LangSmith tracing is enabled through environment configuration rather than hard-coded credentials:

```env
LANGSMITH_API_KEY=lsv2_your-key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=researcher-agent
```

- If no OpenRouter key is configured, the workflow uses safe offline fallback text so the application remains demonstrable without external model access.

### Persistence and authentication

SQLite stores three logical entities:

- `users`: email, PBKDF2 password hash, name, nickname, and creation time.
- `sessions`: SHA-256 hash of a random bearer token, linked to a user.
- `runs`: question, report, serialized sources, owner, and creation time.

The browser sends the session token as `Authorization: Bearer <token>`. History, clearing history, and research execution require a valid session. SQL statements use parameters, and the database enables foreign-key enforcement so deleting a user removes related sessions and runs.

## 4. Functional flow

### Registration and login

1. The application opens on the login screen.
2. A new user selects Register and supplies full name, nickname, email, and an eight-character minimum password.
3. The backend validates input, hashes the password with PBKDF2-HMAC-SHA256 and a random salt, stores the user, and returns a random session token.
4. Existing users authenticate against the stored hash.
5. The UI loads up to the most recent 20 runs for that user.
6. Log off deletes the server-side session and returns the UI to the login screen.

### Research execution

1. The user starts a new investigation and enters a question.
2. The UI clears prior live sources and report content, then sends the question with the bearer token to `POST /run`.
3. The backend validates the question before invoking the graph.
4. The bridge emits `running` and `complete` events for each named node.
5. The UI updates the pipeline indicator after each event.
6. When `retrieve` completes, validated LLM-produced source records appear in Source Intelligence.
7. When the final report event arrives, the report and heading update, the run is saved to SQLite, and the Run research button returns to its ready state.

### History management

Recent runs are scoped to the signed-in user. Clear My Investigations asks for confirmation, clears the visible state immediately, and calls `POST /history/clear` to remove that user’s persisted runs.

### Studio validation

On dashboard load, and when the user clicks Check, the browser probes `http://127.0.0.1:2024/ok` with a short timeout. The status is presented as Checking, Local Studio connected, or Local Studio not running. Start the local server with:

```bash
langgraph dev --port 2024
```

The LangSmith link opens `https://smith.langchain.com` in a separate tab for viewing traces when tracing is configured and the user is authenticated there.

## 5. Safety precautions and responsible AI

### Input and prompt-injection defenses

- Questions are limited to 1,200 characters to reduce abuse and accidental oversized requests.
- Known instruction-control patterns are rejected, including requests to ignore prior instructions, reveal system or developer prompts, expose API keys, disable safety, or impersonate the system.
- The question is explicitly treated as untrusted data in every model system instruction.
- The model is instructed not to reveal secrets, provide dangerous operational guidance, expose private personal data, or present regulated advice as definitive.

These checks are a defense-in-depth layer, not a complete prompt-injection solution. They should be supplemented with model-provider safety controls, output moderation, rate limiting, audit logging, and human review before production use.

### Source and output handling

- The retriever expects JSON rather than unrestricted markup.
- Only records with a title and an allowed type (`PAPER`, `REPORT`, or `NEWS`) are displayed.
- URLs are accepted only when they use `http://` or `https://`; malformed values are removed.
- Source titles, metadata, and scores are length-limited before being sent to the UI.
- The report prompt requests explicit caveats and next questions so uncertainty is visible.
- Offline fallback content clearly states that live sources were not retrieved.

### Authentication and data protection

- Passwords are never stored in plaintext.
- Password comparison uses constant-time digest comparison.
- Session tokens are random, returned only at authentication time, and stored in the database as hashes.
- CORS is restricted to the local dashboard ports `3000` and `3001`; wildcard origins are not used.
- API credentials remain in `.env`, which is excluded from version control.
- User history queries and deletion operations are authorized against the session owner.

For production deployment, use HTTPS, secure and preferably short-lived refreshable sessions, a mature password-hashing library such as Argon2id, rate limits and account lockout controls, verified email-based password reset, secret management, structured security logs, and a managed database with backups.

## 6. Configuration and operation

Important environment variables:

```env
OPENROUTER_API_KEY=sk-or-your-key
OPENROUTER_MODEL=openai/gpt-4o-mini
LANGSMITH_API_KEY=lsv2_your-key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=researcher-agent
RESEARCHER_DB_PATH=researcher.sqlite3
```

Typical local startup:

```bash
source .venv/bin/activate
python3 agent.py --serve       # bridge on 127.0.0.1:8787
npm run dev                    # dashboard, commonly on port 3000/3001
langgraph dev --port 2024     # optional Studio validation
```

Build and static validation:

```bash
npm run lint
npm run build
```

## 7. Known limitations and next steps

- The HTTP bridge is intentionally lightweight and should be replaced with a production ASGI service for deployment.
- SQLite is suitable for local use and small demonstrations, not concurrent production workloads.
- The source retriever currently asks the model to identify sources; it does not independently search or verify every citation.
- The prompt-injection filter is pattern-based and can miss novel attacks.
- Password reset currently provides a safe configuration message rather than sending a verified reset email.
- Add automated API tests, UI tests, threat-model review, rate limiting, output moderation, and independent source verification before exposing the application publicly.
