/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: server.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

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
export type CommitResult = 
  | { success: true; commitHash: string; stamp: string }
  | { success: false; error: string; diagnostics?: unknown };

export class GitHubFortress {
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
    const activeOctokit = token ? new Octokit({ auth: token }) : this.octokit;

    if (!activeOctokit) {
      return { success: false, error: "GITHUB_TOKEN_NULL: Fortress compromised." };
    }

    try {
      // Validate inputs strictly
      if (typeof owner !== 'string' || typeof repo !== 'string' || !Array.isArray(files)) {
        return { success: false, error: "INVALID_INPUT_TYPES" };
      }

      const { data: repository } = await activeOctokit.repos.get({ owner, repo });
      const defaultBranch = repository.default_branch;

      const { data: ref } = await activeOctokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });
      const latestCommitSha = ref.object.sha;

      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await activeOctokit.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: "utf-8",
          });
          return { path: file.path, sha: blob.sha };
        })
      );

      const { data: tree } = await activeOctokit.git.createTree({
        owner,
        repo,
        base_tree: latestCommitSha,
        tree: blobs.map((blobItem) => ({
          path: blobItem.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blobItem.sha,
        })),
      });

      const generationalMessage = `${message}\n\n[GENERATIONAL_STAMP: ${stamp}]\n[DETERMINISTIC_AST_WEIGHTING: ENABLED]`;
      const { data: commit } = await activeOctokit.git.createCommit({
        owner,
        repo,
        message: generationalMessage,
        tree: tree.sha,
        parents: [latestCommitSha],
      });

      await activeOctokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
        sha: commit.sha,
      });

      return { success: true, commitHash: commit.sha, stamp };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return { 
        success: false, 
        error: "DRC_COMMIT_FAILURE", 
        diagnostics: errMessage 
      };
    }
  }
}

const githubFortress = new GitHubFortress();

async function fetchFileContent(baseUrl: string, relativePath: string): Promise<string> {
  try {
    const targetUrl = new URL(relativePath, baseUrl).href;
    const response = await axios.get(targetUrl, { timeout: 5000, responseType: 'text', maxContentLength: 5 * 1024 * 1024 });
    return typeof response.data === 'string' ? response.data : String(response.data);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error(`[FETCH_FAIL] ${relativePath}: ${errMessage}`);
    return `// FAILED_TO_FETCH: ${relativePath}\n// Error: ${errMessage}`;
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

export class SiphonEngine {
  private currentGeneration: string = "V3.2_CORE";

  public siphon(payload: string): SiphonResult<DNAFragment[]> {
    try {
      if (!payload || typeof payload !== 'string' || payload.length === 0) {
        return { success: false, error: "EMPTY_SOURCE_PAYLOAD", entropyLevel: 0.99 };
      }

      const fragments: DNAFragment[] = this.parseDNA(payload);

      if (fragments.length === 0) {
        return { success: false, error: "NO_SURVIVABLE_TRAITS_FOUND", entropyLevel: 0.85 };
      }

      const stampedFragments = fragments.map(fragment => ({
        ...fragment,
        ancestry: `${this.currentGeneration}::${Date.now()}`,
        weight: this.calculateInitialWeight(fragment)
      }));

      return { success: true, data: stampedFragments };
    } catch (criticalFailure: unknown) {
      const errMessage = criticalFailure instanceof Error ? criticalFailure.message : String(criticalFailure);
      return { success: false, error: `CRITICAL_PIPELINE_COLLAPSE: ${errMessage}`, entropyLevel: 1.0 };
    }
  }

  private parseDNA(raw: string): DNAFragment[] {
    const patternRegex = /\[PATTERN: (.*?), STRATEGY: (.*?)\]/g;
    const matches = [...raw.matchAll(patternRegex)];
    
    return matches.map(match => ({
      title: match[1] || "",
      mutation: match[2] || "",
      ancestry: "pending",
      weight: 0
    }));
  }

  private calculateInitialWeight(fragment: DNAFragment): number {
    return fragment.mutation.includes("CRITICAL UPGRADE") ? 1.0 : 0.5;
  }
}

export class RecursiveScout {
  private visited = new Set<string>();
  private assets = new Set<string>();
  private pagesToVisit: string[] = [];
  private baseUrl: string = "";
  private domain: string = "";

  constructor(seedUrl: string) {
    this.baseUrl = seedUrl;
    try {
      this.domain = new URL(seedUrl).hostname;
    } catch {
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

  private async visitPage(url: string): Promise<void> {
    if (this.visited.has(url)) return;
    this.visited.add(url);

    try {
      console.log(`[RECURSIVE_SCOUT] Visiting: ${url}`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'HUXLEY_V3.2_CORE/Scout-Deep' },
        timeout: 5000,
        maxContentLength: 5 * 1024 * 1024,
        validateStatus: (status) => status === 200
      });

      const $ = cheerio.load(typeof response.data === 'string' ? response.data : String(response.data));

      $('link[href], script[src], img[src]').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('href');
        if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
          this.assets.add(src.split('?')[0]);
        }
      });

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, url);
          if (absoluteUrl.hostname === this.domain && !this.visited.has(absoluteUrl.href)) {
            const ext = absoluteUrl.pathname.split('.').pop()?.toLowerCase();
            if (!ext || ['html', 'htm', 'php', 'aspx'].includes(ext)) {
              this.pagesToVisit.push(absoluteUrl.href);
            }
          }
        } catch {
          // Ignore invalid secondary URLs during crawl traversal
        }
      });
    } catch {
      console.warn(`[RECURSIVE_SCOUT] Failed to visit ${url}`);
    }
  }
}

const siphonEngine = new SiphonEngine();

// HUXLEY_GOVERNANCE: Stability vs Acceleration Controller
type GovernanceMode = 'STABILIZE' | 'ACCELERATE';

export class SystemGovernance {
  private mode: GovernanceMode = 'ACCELERATE';
  
  public setMode(mode: GovernanceMode): void {
    if (mode === 'STABILIZE' || mode === 'ACCELERATE') {
      this.mode = mode;
      console.log(`[HUXLEY_GOVERNANCE] Mode Shifted: ${mode}`);
    }
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
  payload: unknown;
  entropy: number;
  timestamp: number;
}

export class EphemeralStorage {
  private state = new Map<string, DNA>();
  private manualPressure: number = 0;
  private decayTimer: NodeJS.Timeout;

  constructor() {
    this.decayTimer = setInterval(() => this.applyDecay(), 20000);
    if (typeof this.decayTimer.unref === 'function') {
      this.decayTimer.unref();
    }
  }

  private calculateSystemicDensity(): number {
    const capacity = 1000;
    return Math.min(1, this.state.size / capacity);
  }

  public setMemoryPressure(pressure: number): void {
    if (typeof pressure === 'number' && !isNaN(pressure)) {
      this.manualPressure = Math.max(0, Math.min(1, pressure));
      if (this.manualPressure > 0.7) this.applyDecay();
    }
  }

  public persist(dna: DNA): void {
    if (!dna || typeof dna.hash !== 'string') return;
    if (this.state.size >= 1000 && !this.state.has(dna.hash)) {
      // Evict oldest or excess elements to protect against memory exhaustion
      const firstKey = this.state.keys().next().value;
      if (firstKey !== undefined) {
        this.state.delete(firstKey);
      }
    }
    this.state.set(dna.hash, dna);
    console.log(`[HUXLEY_STORAGE] DNA Persisted: ${dna.hash} (Density: ${(this.calculateSystemicDensity() * 100).toFixed(2)}%)`);
  }

  private applyDecay(): void {
    const now = Date.now();
    const density = this.calculateSystemicDensity();
    const pressureMultiplier = governance.getPressureMultiplier();
    
    const currentPressure = Math.max(this.manualPressure, density) * pressureMultiplier;
    const isPressureCritical = currentPressure > 0.8;
    
    for (const [hash, dna] of this.state.entries()) {
      const isLowEntropyNoise = dna.entropy < 0.25;
      const baseLifespan = 3600000; 
      const entropyBonus = dna.entropy * 7200000; 
      
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

async function startServer(): Promise<void> {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.post("/api/ai/anthropic", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      res.status(500).json({ error: "ANTHROPIC_API_KEY missing" });
      return;
    }

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
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errMessage });
    }
  });

  app.post("/api/ai/cerebras", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.CEREBRAS_API_KEY;
    if (!key) {
      res.status(500).json({ error: "CEREBRAS_API_KEY missing" });
      return;
    }

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
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errMessage });
    }
  });

  app.post("/api/ai/grok", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.XAI_API_KEY;
    if (!key) {
      res.status(500).json({ error: "XAI_API_KEY missing" });
      return;
    }

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
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errMessage });
    }
  });

  app.post("/api/scout/siphon", async (req, res) => {
    let { url, generation_stamp } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: "Siphon target null or invalid. Structural integrity compromised." });
      return;
    }

    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        res.status(400).json({ success: false, error: "Invalid protocol specified." });
        return;
      }

      console.log(`[HUXLEY_SCOUT] Siphoning reality from: ${url}`);
      
      const scout = new RecursiveScout(url);
      const uniqueFiles = await scout.crawl(2, 20);

      const response = await axios.get(url, {
        headers: { 'User-Agent': 'HUXLEY_V3.2_CORE/Scout-Siphon' },
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024
      });
      
      const rawPayload = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const dnaExtraction = siphonEngine.siphon(rawPayload);
      void dnaExtraction; // Preserved execution reference if needed downstream

      const entropySignature = crypto
        .createHash('sha256')
        .update(uniqueFiles.join('') + (response.headers['content-length'] || '0'))
        .digest('hex')
        .substring(0, 8);

      const result = { 
        success: true,
        origin: url,
        ancestry: {
          parent_stamp: typeof generation_stamp === 'string' ? generation_stamp : "ROOT",
          current_stamp: `GEN_${Date.now()}_${entropySignature}`
        },
        dna_payload: {
          discoveredFiles: uniqueFiles.length > 0 ? uniqueFiles : ["index.html", "main.js", "styles.css"],
          entropy: parseFloat(`0.${parseInt(entropySignature, 16)}`.substring(0, 5))
        }
      };

      huxleyStorage.persist({
        hash: result.ancestry.current_stamp,
        payload: result.dna_payload,
        entropy: result.dna_payload.entropy,
        timestamp: Date.now()
      });

      res.json(result);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.error("Siphon Death Cycle Entry:", errMessage);
      res.status(500).json({ 
        success: false, 
        error: "Siphon Interrupted", 
        message: errMessage,
        cycle: "DEATH_LOG_ENTRY_ACTIVE"
      });
    }
  });

  app.post("/api/scout/extract-dna", (req, res) => {
    const { payload } = req.body;
    if (!payload || typeof payload !== 'string') {
      res.status(400).json({ success: false, error: "Empty or invalid payload. Structural integrity compromised." });
      return;
    }
    
    const result = siphonEngine.siphon(payload);
    if (result.success) {
      result.data.forEach(fragment => {
        huxleyStorage.persist({
          hash: fragment.ancestry,
          payload: fragment,
          entropy: 1.0 - (1.0 / (fragment.weight + 1)),
          timestamp: Date.now()
        });
      });
    }
    res.json(result);
  });

  app.post("/api/github/commit", async (req, res) => {
    const { owner, repo, files, message, stamp, token, baseUrl, fetchFresh } = req.body;
    
    console.log(`[HUXLEY_DRC] Commitment request for ${owner}/${repo} (Files: ${files?.length || 0}, Token Provided: ${!!token})`);
    
    if (!owner || !repo || !files || !Array.isArray(files)) {
      res.status(400).json({ success: false, error: "Missing or invalid repository parameters." });
      return;
    }

    let finalFiles = files;
    if (fetchFresh && typeof baseUrl === 'string') {
      console.log(`[HUXLEY_DRC] Deep Siphon activated for ${baseUrl}`);
      finalFiles = await Promise.all(files.map(async (fileItem: { path: string; fetch?: boolean; content?: string }) => {
        if (fileItem.fetch && typeof fileItem.path === 'string') {
          const content = await fetchFileContent(baseUrl, fileItem.path);
          return { path: fileItem.path, content };
        }
        return fileItem;
      }));
    }

    const result = await githubFortress.commitReality(owner, repo, finalFiles, message, stamp, token);
    res.json(result);
  });

  app.post("/api/github/repos", async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: "Token required" });
      return;
    }

    try {
      const octokit = new Octokit({ auth: token });
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });
      res.json({ success: true, repos: repos.map(repoItem => ({ name: repoItem.name, full_name: repoItem.full_name, html_url: repoItem.html_url })) });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errMessage });
    }
  });

  app.post("/api/scout/ingest", async (req, res) => {
    const { baseUrl, relativePath } = req.body;
    if (!baseUrl || !relativePath || typeof baseUrl !== 'string' || typeof relativePath !== 'string') {
      res.status(400).json({ error: "Missing parameters" });
      return;
    }

    const content = await fetchFileContent(baseUrl, relativePath);
    const fileName = path.basename(relativePath) || 'index.html';
    const targetDir = path.join(process.cwd(), 'src', 'captured');
    
    try {
      await fs.mkdir(targetDir, { recursive: true });
      
      const targetPath = path.join(targetDir, fileName);
      if (!targetPath.startsWith(targetDir)) {
        res.status(403).json({ error: "Forbidden path traversal" });
        return;
      }

      await fs.writeFile(targetPath, content, 'utf-8');
      
      res.json({ 
        success: true, 
        path: `/src/captured/${fileName}`,
        size: content.length 
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errMessage });
    }
  });

  app.post("/api/system/control", (req, res) => {
    const { mode, pressure } = req.body;
    if (mode) governance.setMode(mode);
    if (pressure !== undefined) huxleyStorage.setMemoryPressure(pressure);
    res.json({ success: true, status: huxleyStorage.getStatus() });
  });

  app.get("/api/system/status", (_req, res) => {
    res.json(huxleyStorage.getStatus());
  });

  app.get("/api/system/read-file", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath || typeof filePath !== 'string') {
      res.status(400).send("Path required");
      return;
    }
    
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fullPath.startsWith(process.cwd())) {
        res.status(403).send("Forbidden");
        return;
      }
      
      const content = await fs.readFile(fullPath, "utf-8");
      res.send(content);
    } catch {
      res.status(404).send("File not found");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

void startServer();
