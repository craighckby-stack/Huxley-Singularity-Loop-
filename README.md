# Huxley (SPED PRIME) 🕳️

> **An autonomous AGI bootstrapping environment and self-evolving system.**

Huxley is an autonomous code-generation and self-evolution framework that treats AGI bootstrapping as a first-class problem. Rather than waiting for human prompts, it continuously scrapes, analyzes, debates, and deploys improvements to itself. 

Wrapped in a deeply stylized, narrative-driven "Dark AGI" interface, Huxley abstracts complex cloud orchestration and multi-agent reasoning into an atmospheric, gamified experience.

---

## ⚡ Core Capabilities

* **🧬 DNA Siphoning**
  Active ingestion of architectural logic. Huxley crawls target websites or GitHub repositories, extracting their structural "DNA" (HTML, JS, CSS, images) and pulling them into its local memory pool for analysis.
* **🗣️ Multi-Persona Debate Engine**
  Unlike standard single-prompt wrappers, Huxley spins up competing AI personas (e.g., *Humanist*, *Rationalist*, *Chaotic*, *Innovator*). These agents debate optimization parameters like learning rates and exploration balance. The winning argument dictates the application's evolutionary path.
* **🔄 Execute-First Autonomy (Self-Mutation)**
  Huxley doesn't wait for instructions. Utilizing models like Google Gemini and Cerebras via the *Dalek Caan Mutator*, it identifies patterns, generates architectural improvements, actively rewrites its own source code, and directly pushes updates.
* **☁️ Zero-Touch Cloud Deployment**
  A dynamic pipeline to deploy its own "brain". Huxley handles uploading open-source models (like DeepSeek) directly to Google Cloud Storage via signed URLs, automatically spinning up functioning inference servers on Cloud Run in minutes.
* **⚓ Reality Anchor Sync**
  Maintains structural integrity by syncing its newly evolved codebase states back to GitHub repositories automatically.

---

## 🗺️ Architectural Flow

```text
[Target Source] 
       ↓ 
(DNA Siphon) ──> Extracts patterns, fragments, and architectural logic
       ↓
[Internal Node] 
       ↓
(Debate Engine) ──> Competing AI personas argue over adaptation strategy
       ↓
[Consensus] 
       ↓
(Dalek Caan Mutator) ──> Gemini/Cerebras APIs rewrite local source code
       ↓
[Reality Anchor] ──> Syncs the evolved codebase back to GitHub
       ↓
(Cloud Deployer) ──> Provisions Cloud Run inference endpoints dynamically
```

---

## 🛠️ Technology Stack

* **Frontend:** TypeScript, React, TailwindCSS, Three.js
* **LLM Orchestration:** Google Gemini 2.0, Cerebras, DeepSeek (Dynamic)
* **Infrastructure:** Google Cloud Platform (Cloud Run, Cloud Storage, Signed URLs)
* **Version Control Integration:** GitHub API
* **UX/UI:** Custom atmospheric dashboard (Responsive, Narrative-driven)

---

## 🧠 Why This Matters (Employer Perspective)

Huxley was engineered to push the boundaries of what a full-stack AI application can do, demonstrating:

* **Autonomous Systems Thinking:** Building loops that act without human intervention, effectively managing their own state and error handling.
* **Multi-Agent Reasoning Patterns:** Moving beyond naive prompting to orchestrate complex internal systems where multiple LLM calls interact, compete, and reach consensus.
* **Cloud Infrastructure Mastery:** Securely connecting frontend clients to scalable backend infrastructure dynamically, proving a deep understanding of signed URLs, containerization, and serverless compute.
* **Self-Modifying Architecture:** Writing code that writes code, safely packaging and versioning its own iterations via GitHub Actions/APIs.
* **Sophisticated UX Design:** Translating heavy technical tasks (deploying a massive deep learning model) into an engaging, user-friendly, narrative-driven interface.

---

## 🚀 Getting Started

Huxley operates as a lightweight frontend UI that can dynamically attach itself to heavy backend compute. 

1. Clone the specific reality branch.
2. Install standard dependencies: `npm install`
3. Configure your environment variables for GCP / API keys (see `.env.example`).
4. Boot the cognitive core: `npm run dev`

> **Note:** Proper execution requires a valid GitHub PAT and active GCP service account credentials to handle continuous Reality Anchoring and Cloud Run deployment endpoints.

---

*Huxley Singularity Loop v3.2 — "Code is Flesh."*