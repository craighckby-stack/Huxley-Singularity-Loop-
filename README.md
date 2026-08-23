# Huxley Singularity Loop

> **Autonomous Repository Distillation and Synchronization Engine**

[![Live Preview](https://img.shields.io/badge/Live%20Preview-Online-brightgreen?style=flat-square)](https://ais-pre-km7pxypy7meeld2j6lnyqm-483535245139.asia-southeast1.run.app)
[![Tech Stack](https://img.shields.io/badge/Stack-TypeScript%20%7C%20React%20%7C%20Node.js%20%7C%20TailwindCSS-blue?style=flat-square)](https://github.com)

**Live Demo URL:** [https://ais-pre-km7pxypy7meeld2j6lnyqm-483535245139.asia-southeast1.run.app](https://ais-pre-km7pxypy7meeld2j6lnyqm-483535245139.asia-southeast1.run.app)

---

## Overview

**Huxley Singularity Loop** is an automated code analysis, repository distillation, and GitHub synchronization engine. It ingests existing repository architectures, recursively extracts structural patterns and assets, synthesizes codebase logic through multi-perspective evaluation models, and synchronizes consolidated manifests directly to GitHub branches.

Designed for developers managing fragmented repositories, code migration tasks, and architectural refactoring, Huxley streamlines the process of auditing, squashing, and versioning complex codebases.

---

## Core Capabilities

### 1. Repository & Asset DNA Siphoning (Deep Extraction)
- **Recursive Structural Crawling:** Analyzes remote repositories and live web targets to discover nested file trees, scripts, stylesheets, and modular components.
- **Selective File Ingestion:** Inspects source files, parses AST and syntax patterns, and pulls critical logic into an in-memory analysis buffer.
- **Asset Hierarchy Mapping:** Automatically builds interactive visual directory trees with direct inspection and selective extraction capabilities.

### 2. Multi-Persona Architectural Synthesis
- **Multi-Agent Perspective Evaluation:** Evaluates candidate code patterns across specialized evaluation personas (e.g., Stability/Reliability, Innovation/Modernization, Optimization/Efficiency, and Security).
- **Consensus-Driven Refactoring:** Aggregates multi-model insights into unified, production-ready repository manifests and distilled source components.
- **Algorithmic Logic Distillation:** Condenses bloated dependencies and repetitive boilerplate into clean, maintainable TypeScript/JavaScript modules.

### 3. Automated GitHub Branch Management & Synchronization
- **Direct GitHub REST API Integration:** Authenticates via Personal Access Tokens (PAT) to perform repository discovery, automated branch creation, and safe rollback checkpoints.
- **Tree-Level Distillation Commits:** Generates consolidated atomic commits via the GitHub Git Data API (`/git/trees`, `/git/commits`, `/git/refs`), allowing clean code squashing.
- **Continuous Reality Synchronization:** Pushes validated code updates and synchronized architectural manifests directly to target branches.

### 4. Scalable Cloud Execution Pipeline
- **Cloud Run & Storage Support:** Facilitates deployment workflows for containerized runner services and direct browser-to-bucket signed upload URLs.
- **Lightweight Decoupled Client:** Full-stack architecture with an Express-backed proxy ensuring API tokens and backend credentials remain secure on the server side.

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────┐
│                     1. DISCOVERY & INGEST                   │
│   Target GitHub Repo / Web URL ──> Recursive Scout Crawler   │
│   └──> Extracts File Tree, Components, Styles & Scripts     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    2. MULTI-MODEL SYNTHESIS                 │
│   Extracted Code Context ──> Multi-Persona Synthesis Engine │
│   └──> Evaluates Architecture across Performance & Quality  │
│   └──> Generates Consolidated Code & Distilled Manifest     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    3. GITHUB SYNCHRONIZATION                │
│   Consolidated Logic ──> GitHub Git Data API Engine         │
│   ├──> Creates Backup Branch Snapshot                       │
│   ├──> Commits Atomic Distilled Tree                        │
│   └──> Updates Target Branch Reference                      │
└─────────────────────────────────────────────────────────────┘
```

1. **Target Identification:** Provide a GitHub repository URL or web endpoint and authenticate with your GitHub Personal Access Token.
2. **Recursive Analysis:** The ingestion engine inspects repository hierarchy, identifying core components and pruning unneeded artifacts.
3. **Synthesis & Distillation:** Multi-model evaluators analyze the codebase, extracting architectural logic into unified modules.
4. **Automated Commit & Deployment:** The synchronized manifest is committed directly to the designated branch, creating a clean, versioned baseline.

---

## Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend / API:** Node.js, Express, Axios, Cheerio (DOM/HTML parsing)
- **Version Control & Cloud:** GitHub REST API (`@octokit/rest`), Google Cloud Run, Google Cloud Storage
- **AI & Synthesis:** Google Gemini API (Server-Side Integration)

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn
- GitHub Personal Access Token (with `repo` scope for branch management and commit operations)
- Google Gemini API Key (configured in environment)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/huxley-singularity-loop.git
   cd huxley-singularity-loop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## Live Deployment

Experience the live application in the preview environment:

🔗 **[Launch Huxley Live Preview](https://ais-pre-km7pxypy7meeld2j6lnyqm-483535245139.asia-southeast1.run.app)**

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
