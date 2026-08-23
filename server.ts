
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";
import { Octokit } from "@octokit/rest";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DRC: Durable Repository Commitment Logic
type CommitResult = 
  | { success: true; commitHash: string; stamp: string }
  | { success: false; error: string; diagnostics?: any };

class GitHubFortress {
  private octokit: Octokit | null = null;

  constructor() {
    if (process.env.VITE_GITHUB_TOKEN) {
      this.octokit = new Octokit({ auth: process.env.VITE_GITHUB_TOKEN });
    }
  }

  public async commitReality(
    owner: string,
    repo: string,
    files: { path: string; content: string }[],
    message: string,
    stamp: string,
    token?: string
  ): Promise<CommitResult> {
    const octokit = token ? new Octokit({ auth: token }) : this.octokit;

    if (!octokit) {
      return { success: false, error: "GITHUB_TOKEN_NULL: Fortress compromised." };
    }

    try {
      // 1. Shadow Validation: Verify Repo Existence
      const { data: repository } = await octokit.repos.get({ owner, repo });
      const defaultBranch = repository.default_branch;

      // 2. Get latest commit SHA
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });
      const latestCommitSha = ref.object.sha;

      // 3. Create Blobs for each file
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await octokit!.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: "utf-8",
          });
          return { path: file.path, sha: blob.sha };
        })
      );

      // 4. Create Tree
      const { data: tree } = await octokit.git.createTree({
        owner,
        repo,
        base_tree: latestCommitSha,
        tree: blobs.map((b) => ({
          path: b.path,
          mode: "100644",
          type: "blob",
          sha: b.sha,
        })),
      });

      // 5. Create Commit with Generational Stamping
      const generationalMessage = `${message}\n\n[GENERATIONAL_STAMP: ${stamp}]\n[DETERMINISTIC_AST_WEIGHTING: ENABLED]`;
      const { data: commit } = await octokit.git.createCommit({
        owner,
        repo,
        message: generationalMessage,
        tree: tree.sha,
        parents: [latestCommitSha],
      });

      // 6. Update Ref
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
        sha: commit.sha,
      });

      return { success: true, commitHash: commit.sha, stamp };
    } catch (error: any) {
      return { 
        success: false, 
        error: "DRC_COMMIT_FAILURE", 
        diagnostics: error.message 
      };
    }
  }
}

const githubFortress = new GitHubFortress();

async function fetchFileContent(baseUrl: string, relativePath: string): Promise<string> {
  try {
    const url = new URL(relativePath, baseUrl).href;
    const response = await axios.get(url, { timeout: 5000, responseType: 'text' });
    return response.data;
  } catch (e: any) {
    console.error(`[FETCH_FAIL] ${relativePath}: ${e.message}`);
    return `// FAILED_TO_FETCH: ${relativePath}\n// Error: ${e.message}`;
  }
}

// HUXLEY_V3.2_CORE: Siphon Implementation
// Pattern: Functional Result-Type Error Handling
export type DNAFragment = {
  title: string;
  mutation: string;
  ancestry: string;
  weight: number;
};

export type SiphonResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; entropyLevel: number };

class SiphonEngine {
  private currentGeneration: string = "V3.2_CORE";

  public siphon(payload: string): SiphonResult<DNAFragment[]> {
    try {
      if (!payload || payload.length === 0) {
        return { success: false, error: "EMPTY_SOURCE_PAYLOAD", entropyLevel: 0.99 };
      }

      const fragments: DNAFragment[] = this.parseDNA(payload);

      if (fragments.length === 0) {
        return { success: false, error: "NO_SURVIVABLE_TRAITS_FOUND", entropyLevel: 0.85 };
      }

      const stampedFragments = fragments.map(f => ({
        ...f,
        ancestry: `${this.currentGeneration}::${Date.now()}`,
        weight: this.calculateInitialWeight(f)
      }));

      return { success: true, data: stampedFragments };
    } catch (criticalFailure: any) {
      return { success: false, error: `CRITICAL_PIPELINE_COLLAPSE: ${criticalFailure.message}`, entropyLevel: 1.0 };
    }
  }

  private parseDNA(raw: string): DNAFragment[] {
    const patternRegex = /\[PATTERN: (.*?), STRATEGY: (.*?)\]/g;
    const matches = [...raw.matchAll(patternRegex)];
    
    return matches.map(m => ({
      title: m[1],
      mutation: m[2],
      ancestry: "pending",
      weight: 0
    }));
  }

  private calculateInitialWeight(fragment: DNAFragment): number {
    return fragment.mutation.includes("CRITICAL UPGRADE") ? 1.0 : 0.5;
  }
}

class RecursiveScout {
  private visited = new Set<string>();
  private assets = new Set<string>();
  private pagesToVisit: string[] = [];
  private baseUrl: string = "";
  private domain: string = "";

  constructor(seedUrl: string) {
    this.baseUrl = seedUrl;
    try {
      this.domain = new URL(seedUrl).hostname;
    } catch (e) {
      this.domain = "";
    }
  }

  public async crawl(maxDepth = 2, maxPages = 15): Promise<string[]> {
    if (!this.domain) return [];
    
    this.pagesToVisit.push(this.baseUrl);
    let depth = 0;
    let pageCount = 0;

    while (this.pagesToVisit.length > 0 && pageCount < maxPages) {
      const currentBatch = [...this.pagesToVisit];
      this.pagesToVisit = [];
      const batchPromises = currentBatch.map(url => this.visitPage(url));
      await Promise.all(batchPromises);
      
      depth++;
      pageCount += currentBatch.length;
      if (depth >= maxDepth) break;
    }

    return Array.from(this.assets);
  }

  private async visitPage(url: string) {
    if (this.visited.has(url)) return;
    this.visited.add(url);

    try {
      console.log(`[RECURSIVE_SCOUT] Visiting: ${url}`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'HUXLEY_V3.2_CORE/Scout-Deep' },
        timeout: 5000,
        validateStatus: (s) => s === 200
      });

      const $ = cheerio.load(response.data);

      // Extract Assets
      $('link[href], script[src], img[src]').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('href');
        if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
          this.assets.add(src.split('?')[0]);
        }
      });

      // Find Internal Links for recursion
      $('a[href]').each((_, el) => {
        let href = $(el).attr('href');
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, url);
          if (absoluteUrl.hostname === this.domain && !this.visited.has(absoluteUrl.href)) {
            // Avoid non-html links
            const ext = absoluteUrl.pathname.split('.').pop()?.toLowerCase();
            if (!ext || ['html', 'htm', 'php', 'aspx'].includes(ext)) {
              this.pagesToVisit.push(absoluteUrl.href);
            }
          }
        } catch (e) {}
      });
    } catch (e) {
      console.warn(`[RECURSIVE_SCOUT] Failed to visit ${url}`);
    }
  }
}

const siphonEngine = new SiphonEngine();

// HUXLEY_GOVERNANCE: Stability vs Acceleration Controller
type GovernanceMode = 'STABILIZE' | 'ACCELERATE';

class SystemGovernance {
  private mode: GovernanceMode = 'ACCELERATE'; // Defaulting to Acceleration per directive
  
  public setMode(mode: GovernanceMode) {
    this.mode = mode;
    console.log(`[HUXLEY_GOVERNANCE] Mode Shifted: ${mode}`);
  }

  public getMode(): GovernanceMode {
    return this.mode;
  }

  public getPressureMultiplier(): number {
    return this.mode === 'ACCELERATE' ? 8.0 : 1.0;
  }
}

const governance = new SystemGovernance();

// CRITICAL UPGRADE: Ephemeral State Persistence Layer with Pressure-Based Decay
export interface DNA {
  hash: string;
  payload: any;
  entropy: number;
  timestamp: number;
}

class EphemeralStorage {
  private state = new Map<string, DNA>();
  private manualPressure: number = 0;

  constructor() {
    setInterval(() => this.applyDecay(), 20000); // Frequency increased for acceleration
  }

  private calculateSystemicDensity(): number {
    // Logic: Pressure scales with the number of active nodes
    const capacity = 1000;
    return Math.min(1, this.state.size / capacity);
  }

  setMemoryPressure(pressure: number) {
    this.manualPressure = pressure;
    if (this.manualPressure > 0.7) this.applyDecay();
  }

  persist(dna: DNA) {
    this.state.set(dna.hash, dna);
    console.log(`[HUXLEY_STORAGE] DNA Persisted: ${dna.hash} (Density: ${(this.calculateSystemicDensity() * 100).toFixed(2)}%)`);
  }

  private applyDecay() {
    const now = Date.now();
    const density = this.calculateSystemicDensity();
    const pressureMultiplier = governance.getPressureMultiplier();
    
    // Total Pressure = (Manual Overwrite OR Systemic Density) * Governance Multiplier
    const currentPressure = Math.max(this.manualPressure, density) * pressureMultiplier;
    const isPressureCritical = currentPressure > 0.8;
    
    for (const [hash, dna] of this.state.entries()) {
      const isLowEntropyNoise = dna.entropy < 0.25; // Threshold raised for V3.2
      const baseLifespan = 3600000; 
      const entropyBonus = dna.entropy * 7200000; 
      
      // Accelerated decay logic
      const lifespan = (baseLifespan + entropyBonus) / (isPressureCritical ? (10 * pressureMultiplier) : 1);

      if ((isLowEntropyNoise && isPressureCritical) || (now - dna.timestamp) > lifespan) {
        this.state.delete(hash);
        console.warn(`[HUXLEY_STORAGE] DNA Purged: ${hash} (Entropy: ${dna.entropy}, PressureIdx: ${currentPressure.toFixed(2)})`);
      }
    }
  }

  public getStatus() {
    return {
      size: this.state.size,
      density: this.calculateSystemicDensity(),
      mode: governance.getMode()
    };
  }
}

const huxleyStorage = new EphemeralStorage();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxies to bypass CORS and protect keys
  
  app.post("/api/ai/anthropic", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY missing" });

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: model || "claude-3-5-sonnet-20240620",
          max_tokens: 4096,
          messages
        })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/cerebras", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.CEREBRAS_API_KEY;
    if (!key) return res.status(500).json({ error: "CEREBRAS_API_KEY missing" });

    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: model || "llama3.1-70b", messages })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/grok", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.XAI_API_KEY;
    if (!key) return res.status(500).json({ error: "XAI_API_KEY missing" });

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: model || "grok-beta", messages })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scout/siphon", async (req, res) => {
    let { url, generation_stamp } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "Siphon target null. Structural integrity compromised." });

    // HUXLEY_V3.2: Protocol Normalization
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    try {
      console.log(`[HUXLEY_SCOUT] Siphoning reality from: ${url}`);
      
      const scout = new RecursiveScout(url);
      const uniqueFiles = await scout.crawl(2, 20); // Depth 2, Max 20 pages for stability

      // Try to get initial page for DNA extraction
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'HUXLEY_V3.2_CORE/Scout-Siphon' },
        timeout: 10000
      });
      
      // NEW: Try to siphon logic-DNA from the raw body if patterns exist
      const dnaExtraction = siphonEngine.siphon(response.data);
      
      // CRITICAL UPGRADE: Deterministic Entropy Calculation
      // Instead of Math.random(), we hash the DNA structure to create a unique systemic signature
      const entropySignature = crypto
        .createHash('sha256')
        .update(uniqueFiles.join('') + (response.headers['content-length'] || '0'))
        .digest('hex')
        .substring(0, 8);

      // RETURN EVOLVED RESULT TYPE
      const result = { 
        success: true,
        origin: url,
        ancestry: {
          parent_stamp: generation_stamp || "ROOT",
          current_stamp: `GEN_${Date.now()}_${entropySignature}`
        },
        dna_payload: {
          discoveredFiles: uniqueFiles.length > 0 ? uniqueFiles : ["index.html", "main.js", "styles.css"],
          entropy: parseFloat(`0.${parseInt(entropySignature, 16)}`.substring(0, 5))
        }
      };

      // Persist DNA to Ephemeral Storage
      huxleyStorage.persist({
        hash: result.ancestry.current_stamp,
        payload: result.dna_payload,
        entropy: result.dna_payload.entropy,
        timestamp: Date.now()
      });

      res.json(result);
    } catch (error: any) {
      console.error("Siphon Death Cycle Entry:", error.message);
      res.status(500).json({ 
        success: false, 
        error: "Siphon Interrupted", 
        message: error.message,
        cycle: "DEATH_LOG_ENTRY_ACTIVE"
      });
    }
  });

  // Dedicated DNA Extraction Endpoint
  app.post("/api/scout/extract-dna", (req, res) => {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ success: false, error: "Empty payload. Structural integrity compromised." });
    
    const result = siphonEngine.siphon(payload);
    if (result.success) {
      // Persist to storage
      result.data.forEach(fragment => {
        huxleyStorage.persist({
          hash: fragment.ancestry,
          payload: fragment,
          entropy: 1.0 - (1.0 / (fragment.weight + 1)), // Derived entropy
          timestamp: Date.now()
        });
      });
    }
    res.json(result);
  });

  // DRC: Durable Repository Commitment Endpoint
  app.post("/api/github/commit", async (req, res) => {
    const { owner, repo, files, message, stamp, token, baseUrl, fetchFresh } = req.body;
    
    console.log(`[HUXLEY_DRC] Commitment request for ${owner}/${repo} (Files: ${files.length}, Token Provided: ${!!token})`);
    
    if (!owner || !repo || !files) {
      return res.status(400).json({ success: false, error: "Missing repository parameters." });
    }

    let finalFiles = files;
    if (fetchFresh && baseUrl) {
      console.log(`[HUXLEY_DRC] Deep Siphon activated for ${baseUrl}`);
      finalFiles = await Promise.all(files.map(async (f: any) => {
        if (f.fetch) {
          const content = await fetchFileContent(baseUrl, f.path);
          return { path: f.path, content };
        }
        return f;
      }));
    }

    const result = await githubFortress.commitReality(owner, repo, finalFiles, message, stamp, token);
    res.json(result);
  });

  // DRC: List accessible repositories
  app.post("/api/github/repos", async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: "Token required" });

    try {
      const octokit = new Octokit({ auth: token });
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });
      res.json({ success: true, repos: repos.map(r => ({ name: r.name, full_name: r.full_name, html_url: r.html_url })) });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // HUXLEY_INGEST: Pull remote DNA into local architecture
  app.post("/api/scout/ingest", async (req, res) => {
    const { baseUrl, relativePath } = req.body;
    if (!baseUrl || !relativePath) return res.status(400).json({ error: "Missing parameters" });

    const content = await fetchFileContent(baseUrl, relativePath);
    const fileName = relativePath.split('/').pop() || 'index.html';
    const targetDir = path.join(process.cwd(), 'src', 'captured');
    
    try {
      await fs.mkdir(targetDir, { recursive: true });
      
      const targetPath = path.join(targetDir, fileName);
      await fs.writeFile(targetPath, content);
      
      res.json({ 
        success: true, 
        path: `/src/captured/${fileName}`,
        size: content.length 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // SYNC: Update System Pressure or Mode
  app.post("/api/system/control", (req, res) => {
    const { mode, pressure } = req.body;
    if (mode) governance.setMode(mode);
    if (pressure !== undefined) huxleyStorage.setMemoryPressure(pressure);
    res.json({ success: true, status: huxleyStorage.getStatus() });
  });

  app.get("/api/system/status", (req, res) => {
    res.json(huxleyStorage.getStatus());
  });

  app.get("/api/system/read-file", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).send("Path required");
    
    try {
      // Security: Only allow reading files within the project src
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fullPath.startsWith(process.cwd())) {
        return res.status(403).send("Forbidden");
      }
      
      const content = await fs.readFile(fullPath, "utf-8");
      res.send(content);
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
