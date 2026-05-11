# PyExec — Python Code Execution Engine

A full-stack single-page application where users can write Python code, execute it on the server, and see real-time output — with a strict **2-second timeout** to prevent infinite loops.

Built for the **Empower Global Tech AI Pvt. Ltd.** Full Stack Web Developer Intern technical assignment.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Code Editor | CodeMirror 6 with Python syntax highlighting |
| Styling | Tailwind CSS + Custom CSS (dark premium theme) |
| Backend | FastAPI (Python 3.11) |
| Execution | `subprocess.run` with `timeout=2` |
| Containerization | Docker (optional bonus) |

---

## 📁 Project Structure

```
code_checker_python/
├── backend/
│   ├── main.py           # FastAPI app with /execute endpoint
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Docker container (bonus)
├── frontend/
│   ├── app/
│   │   ├── page.tsx      # Main UI page
│   │   ├── layout.tsx    # Root layout + metadata
│   │   └── globals.css   # Premium dark theme styles
│   ├── components/
│   │   └── CodeEditor.tsx # CodeMirror 6 editor component
│   └── .env.local        # Backend URL config
└── README.md
```

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+

---

### 1. Start the Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

---

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

### 3. Run with Docker (Optional Bonus)

```bash
cd backend

# Build the image
docker build -t pyexec-backend .

# Run the container
docker run -p 8000:8000 pyexec-backend
```

---

## ✅ Test Cases

### Test 1 — Success
```python
print("Hello Empower")
```
**Expected output:** `Hello Empower`

### Test 2 — Timeout (Infinite Loop)
```python
while True:
    pass
```
**Expected output:** `⏱️ Timeout: Code execution exceeded the 2-second limit.`

Both test cases are pre-loaded as buttons in the UI.

---

## 🔐 Security Risks in the Current Implementation

> **Q: What security risks still exist in your current implementation?**

Despite the 2-second timeout, the following risks remain:

1. **Arbitrary Code Execution (RCE)** — Users can run any Python code, including system calls (`os.system`, `subprocess`, `shutil.rmtree`), file reads/writes, and network requests. A malicious user could delete files, read secrets, or exfiltrate data from the server.

2. **File System Access** — The executed code runs as the same user as the server process. It can read, write, or delete any file the server user has access to.

3. **Network Abuse** — Code can make outbound HTTP requests (e.g., `import requests; requests.get("http://evil.com")`), enabling SSRF attacks or using the server as a bot.

4. **Resource Exhaustion** — While execution time is limited, code can still exhaust **memory** (e.g., `x = [0] * 10**9`) or **CPU** within the 2-second window before being killed.

5. **Fork Bombs** — `import os; os.fork()` can spawn many child processes rapidly, potentially crashing the host.

6. **Sensitive Data Exposure** — Code can read environment variables (`import os; print(os.environ)`) exposing API keys and secrets.

7. **No Rate Limiting** — The `/execute` endpoint has no rate limiting, allowing DoS via repeated rapid requests.

8. **CORS** — Currently configured for `localhost` only; needs strict origin validation in production.

---

## 📈 Scalability: 500 Concurrent Users

> **Q: If 500 students press "Run" at the exact same time, how would you redesign this architecture for production?**

The current single-server design would collapse under 500 simultaneous requests (each blocking for up to 2 seconds). Here's the production redesign:

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Next.js    │────▶│   API Gateway /  │────▶│   Job Queue        │
│  Frontend   │     │   Load Balancer  │     │   (Redis/BullMQ)   │
└─────────────┘     └──────────────────┘     └────────┬───────────┘
                                                        │
                              ┌─────────────────────────▼──────────┐
                              │       Worker Pool (Auto-scaled)     │
                              │  ┌──────────┐  ┌──────────┐        │
                              │  │ Worker 1 │  │ Worker 2 │  ...   │
                              │  │ (Docker) │  │ (Docker) │        │
                              │  └──────────┘  └──────────┘        │
                              └────────────────────────────────────┘
```

### Key Changes:

| Problem | Solution |
|---------|----------|
| Blocking requests | Async job queue (Redis + BullMQ/Celery) — return a job ID immediately |
| Code isolation | Each execution in its own **Docker container** (gVisor/nsjail sandbox) |
| Horizontal scaling | Kubernetes workers with **HPA** auto-scaling on queue depth |
| Memory bombs | `ulimit` + cgroup memory limits per container (e.g., 64MB max) |
| Network abuse | Network namespace isolation — **no internet access** inside containers |
| Rate limiting | API Gateway rate limits (e.g., 10 runs/min per IP) |
| Result delivery | WebSocket or polling on job ID instead of HTTP long-polling |
| Production sandbox | Use **Judge0** or **Piston** (open-source code execution engines) |

---

## 🏗️ Architecture Diagram

```
User Browser
     │
     ▼
Next.js Frontend (Vercel)
     │  POST /execute {code}
     ▼
FastAPI Backend (Render/Railway)
     │  subprocess.run(["python3", tmpfile], timeout=2)
     ▼
Python 3 Process (isolated temp file)
     │
     ▼
stdout / stderr / TimeoutExpired
     │
     ▼
JSON Response → Frontend renders output
```

---

## 👤 Author

Built with ❤️ for the Empower Global Tech AI Pvt. Ltd. internship technical assignment.
