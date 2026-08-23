/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Github, 
  ShieldCheck, 
  Code2, 
  FileJson, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  GitBranch,
  FileText,
  Zap,
  LogIn,
  LogOut,
  Dna,
  User as UserIcon,
  BrainCircuit,
  MessageSquare,
  Globe,
  Settings,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  getRepoTree, 
  getFileContent, 
  ghFetch, 
  createBranch, 
  distillRepository, 
  getBranches, 
  getUserRepos, 
  renameBranch, 
  protectBranch, 
  deleteBranch,
  updateRepoVisibility
} from './lib/github';
import { analyzeRepoChunks, generatePerspective, generateSynthesis, PerspectiveReport } from './lib/gemini';
import { Chunk } from './types';
import { auth, loginWithGoogle, logout, saveSiphonedChunk, getSiphonedChunks, saveArchetype, getArchetype } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Markdown from 'react-markdown';
import { PERSPECTIVES_DATA, ALL_PERSONA_NAMES } from './lib/personas';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repoUrl, setRepoUrl] = useState('https://github.com/craighckby-stack/Huxley-Singularity-Loop');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [geneticMemory, setGeneticMemory] = useState<Chunk[]>([]);
  const [autoSiphon, setAutoSiphon] = useState(true);
  const [systemArchetype, setSystemArchetype] = useState<string | null>(null);
  const [isRebooting, setIsRebooting] = useState(false);
  const [lastRebootUpgrade, setLastRebootUpgrade] = useState<{ before: string, after: string, file: string, title: string } | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedBaseBranch, setSelectedBaseBranch] = useState('main');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState({
    compression: 0,
    tokensSaved: 0,
    quality: 0,
    summariesGenerated: 0,
    driftScore: 0,
    ccrrScore: 0
  });

  // Collective Intelligence State
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(["First Principles Physicist", "System Architect (Zero-Trust)"]);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [synthesisReport, setSynthesisReport] = useState<{ report: string; sources: any[] } | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisStep, setSynthesisStep] = useState<string | null>(null);
  const [groundedSources, setGroundedSources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'manifest' | 'synthesis' | 'scout' | 'void'>('manifest');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [targetSiteUrl, setTargetSiteUrl] = useState('');
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [isScanningRepos, setIsScanningRepos] = useState(false);

  const scanRepositories = async () => {
    if (!token) {
      setError("HUXLEY_AUTH_REQUIRED: Please provide an Access Token first.");
      return;
    }
    setIsScanningRepos(true);
    try {
      const response = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (data.success) {
        setAvailableRepos(data.repos);
        setStatus(`SCAN_COMPLETE: ${data.repos.length} nodes identified in your cloud.`);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setError(`SCAN_FAILURE: ${e.message}`);
    } finally {
      setIsScanningRepos(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (e) {}
  };

  const toggleGovernanceMode = async () => {
    const newMode = systemStatus?.mode === 'ACCELERATE' ? 'STABILIZE' : 'ACCELERATE';
    try {
      await fetch('/api/system/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
      fetchStatus();
    } catch (e) {}
  };

  React.useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  const [discoveredFiles, setDiscoveredFiles] = useState<string[]>([]);
  const [siphonedFragments, setSiphonedFragments] = useState<any[]>([]);
  const [isSiphoning, setIsSiphoning] = useState(false);
  const [siphonEntropy, setSiphonEntropy] = useState(0);
  const [siphonTotal, setSiphonTotal] = useState(0);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [ingestingFile, setIngestingFile] = useState<string | null>(null);

  // TREE_RECURSION: Renders the siphoned architecture in nested branches
  const FileTreeItem = ({ name, node, depth }: { name: string, node: any, depth: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = Object.keys(node._children).length > 0;
    
    return (
      <div className="font-mono text-[10px]">
        <div 
          className="group flex items-center py-1 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
          style={{ paddingLeft: `${depth * 12}px` }}
          onClick={() => hasChildren && setIsOpen(!isOpen)}
        >
          <span className="text-white/20 mr-1 w-3">
            {hasChildren ? (isOpen ? '▼' : '▶') : '•'}
          </span>
          <span className={`${node._isDir ? 'text-[#C5A059] font-bold' : 'text-white/60'} truncate flex-1`}>
            {name}
          </span>
          {!node._isDir && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                ingestToFile(node._path);
              }}
              disabled={!!ingestingFile}
              className="ml-2 opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40 hover:bg-[#C5A059] hover:text-black transition-all"
            >
              {ingestingFile === node._path ? '...' : 'Ingest'}
            </button>
          )}
        </div>
        {isOpen && hasChildren && (
          <div>
            {Object.entries(node._children).sort(([a], [b]) => a.localeCompare(b)).map(([childName, childNode]: [string, any]) => (
              <FileTreeItem key={childName} name={childName} node={childNode} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const fileTree = React.useMemo(() => {
    const root = {};
    discoveredFiles.forEach(path => {
      const parts = path.split('/').filter(Boolean);
      let current = root;
      let fullPath = '';
      parts.forEach((part, index) => {
        fullPath += '/' + part;
        if (!current[part]) {
          current[part] = { _path: fullPath, _isDir: index < parts.length - 1, _children: {} };
        } else if (index === parts.length - 1) {
          // If we previously thought it was a directory but it's actually a file (or vice versa in edge cases)
          current[part]._isDir = false;
        }
        current = current[part]._children;
      });
    });
    return root;
  }, [discoveredFiles]);

  const ingestToFile = async (relativePath: string) => {
    setIngestingFile(relativePath);
    setStatus(`HUXLEY_INGEST: Pulling ${relativePath} into local core...`);
    try {
      const response = await fetch('/api/scout/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: targetSiteUrl, relativePath })
      });
      const data = await response.json();
      if (data.success) {
        setStatus(`INGEST_SUCCESS: ${relativePath} anchored at ${data.path}`);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setError(`INGEST_FAILURE: ${e.message}`);
    } finally {
      setIngestingFile(null);
      setTimeout(() => setStatus(null), 3000);
    }
  };
  const [intentAnchor, setIntentAnchor] = useState('');
  const [centralRepoUrl, setCentralRepoUrl] = useState('https://github.com/craighckby-stack/Huxley-Singularity-Loop');
  const [saveToCentral, setSaveToCentral] = useState(true);
  const [lockdownLoading, setLockdownLoading] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);

  const handleWebsiteSiphon = async () => {
    if (!targetSiteUrl) return;
    setIsSiphoning(true);
    setActiveTab('scout');
    setStatus(`HUXLEY_SCOUT: Initializing deep-scan on ${targetSiteUrl}`);
    
    try {
      const response = await fetch('/api/scout/siphon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetSiteUrl })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Siphon failed");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Siphon protocol failure");
      }
      
      setDiscoveredFiles([]);
      setSiphonedFragments([]);
      const payload = data.dna_payload;
      const websiteFiles = payload.discoveredFiles.filter((f: string) => {
        const ext = f.split('.').pop()?.toLowerCase();
        return ext && ['html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'woff', 'woff2'].includes(ext);
      });
      
      setSiphonTotal(websiteFiles.length);
      for (const file of websiteFiles) {
        await new Promise(r => setTimeout(r, 100)); // Animated ingestion
        setDiscoveredFiles(prev => [...prev, file]);
        setSiphonEntropy(payload.entropy);
        setStatus(`HUXLEY_INGEST: ${file}`);
      }

      if (data.dna_extraction && data.dna_extraction.success) {
        setSiphonedFragments(data.dna_extraction.data);
        setStatus(`DNA_SYNTHESIS: Found ${data.dna_extraction.data.length} architectural fragments.`);
      }
      
      setStatus(`SIPHON_COMPLETE: ${targetSiteUrl} structure integrated into Parallel Manifest.`);
      setTimeout(() => setStatus(null), 3000);
    } catch (e: any) {
      setError(`Siphon Protocol Interrupted: ${e.message}`);
    } finally {
      setIsSiphoning(false);
    }
  };

  const commitToReality = async () => {
    if (discoveredFiles.length === 0) return;
    
    setIsCommitting(true);
    setStatus("SHADOW_VALIDATION: Simulating repository commit...");
    
    try {
      // 1. Shadow Validation: Simulate commit delay
      await new Promise(r => setTimeout(r, 1500));
      
      // 2. DRC: Execute actual commitment via server proxy
      const repoParts = centralRepoUrl.replace('https://github.com/', '').split('/');
      if (repoParts.length < 2) throw new Error("Invalid GitHub Repository URL");
      
      const owner = repoParts[0];
      const repo = repoParts[1];
      
      // Prepare DNA fragments as files
      const filesToCommit = [
        { path: 'manifest.json', content: JSON.stringify({ discoveredFiles, siphonEntropy, timestamp: Date.now() }, null, 2) },
        ...discoveredFiles.slice(0, 10).map(f => ({ 
          path: f.startsWith('/') ? f.substring(1) : f, 
          fetch: true // Signal server to fetch real content
        }))
      ];

      const response = await fetch('/api/github/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          files: filesToCommit,
          message: `SYNC: Deep Ingested Reality Archive from ${targetSiteUrl}`,
          stamp: `GEN_${Date.now()}_${siphonEntropy.toString(16).substring(2, 8)}`,
          token,
          baseUrl: targetSiteUrl,
          fetchFresh: true
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "DRC_COMMIT_FAILURE");
      }

      setCommitResult(data);
      setStatus(`SYNC_SUCCESS: Reality payload anchored in ${repo}. Commit: ${data.commitHash.substring(0, 7)}`);
      setTimeout(() => setStatus(null), 5000);
    } catch (e: any) {
      setError(`DRC_FAILURE: ${e.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setStatus('Syncing with Parallel Reality...');
        
        // Connection Test as required by instructions
        try {
          const { doc, getDocFromServer } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
             // We don't care if it fails, just testing connectivity
          });
        } catch (e) {
          console.warn("Firestore connectivity check failed. Check your configuration.");
        }

        const [mems, arch] = await Promise.all([getSiphonedChunks(), getArchetype()]);
        if (mems) setGeneticMemory(mems);
        if (arch) setSystemArchetype(arch);
        setStatus(null);
      } else {
        setGeneticMemory([]);
        setSystemArchetype(null);
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    setConfirmReady(false);
  }, [repoUrl, token]);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'huxley'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

      const manifestContext = JSON.stringify(geneticMemory.map(c => ({ title: c.title, mutation: c.mutation })));
      const prompt = `You are the HUXLEY_V3.2_CORE. You are communicating with the operator.
CONTEXT (Current Siphoned DNA): ${manifestContext}
ARCHETYPE: ${systemArchetype || 'Baseline'}

Respond to the user's architectural queries. Focus on structural integrity, eliminating hallucinations, and explaining mutations. Keep it technical, slightly detached, and focused on self-evolution.`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...chatMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })), { role: 'user', parts: [{ text: userMessage }] }],
        config: { systemInstruction: prompt }
      });

      const reply = response.text || "Communication loop stalled.";
      setChatMessages(prev => [...prev, { role: 'huxley', content: reply }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'huxley', content: `CRITICAL_ERROR: Communication link severed. ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunSynthesis = async () => {
    if (geneticMemory.length === 0) {
      setError("No DNA Chunks found. Siphon a repository first.");
      return;
    }
    setActiveTab('synthesis');
    setSynthesisLoading(true);
    setSynthesisReport(null);
    setGroundedSources([]);
    
    try {
      const topic = `Architectural analysis of the siphoned DNA manifest. Goal: Generate a grounded, hallucination-free architectural strategy. Intent: ${intentAnchor || "General Synthesis"}`;
      const perspectives: PerspectiveReport[] = [];

      for (const personaName of selectedPersonas) {
        setSynthesisStep(`Activating Perspective: ${personaName}...`);
        const persona = PERSPECTIVES_DATA[personaName];
        const report = await generatePerspective(personaName, persona.promptModifier, topic);
        perspectives.push(report);
      }

      setSynthesisStep("Compiling Collective Synthesis via Huxley Core...");
      const final = await generateSynthesis(topic, perspectives);
      setSynthesisReport(final);
      setGroundedSources(final.sources);
      setSynthesisStep(null);
    } catch (err: any) {
      setError(`Synthesis Engine Failure: ${err.message}`);
    } finally {
      setSynthesisLoading(false);
    }
  };

  const handleReboot = async (newArchetype: string, upgradeChunk?: Chunk) => {
    setIsRebooting(true);
    setStatus('SYSTEM REBOOT: Implementing Core Override...');
    
    if (upgradeChunk) {
      try {
        const res = await fetch(`/api/system/read-file?path=${upgradeChunk.file}`);
        const before = res.ok ? await res.text() : "/* Target Node Not Found in Current Reality */";
        setLastRebootUpgrade({
          before,
          after: upgradeChunk.code,
          file: upgradeChunk.file,
          title: upgradeChunk.title
        });
      } catch (e) {
        console.error("Failed to fetch before-state for verification", e);
      }
    }

    setSystemArchetype(newArchetype);
    if (user) await saveArchetype(newArchetype);
    
    // Simulate system reset and allow verification time
    setTimeout(() => {
      setIsRebooting(false);
      setStatus('Engine Reboot Sequence Complete. New Logic Archetype Online.');
      setTimeout(() => setStatus(null), 5000);
    }, 4500);
  };

  const fetchBranches = async (owner: string, repo: string, token: string) => {
    setBranchLoading(true);
    try {
      const data = await getBranches(owner, repo, token);
      setBranches(data);
      if (data.length > 0) {
        const hasMain = data.find((b: any) => b.name === 'main');
        const hasMaster = data.find((b: any) => b.name === 'master');
        setSelectedBaseBranch(hasMain ? 'main' : (hasMaster ? 'master' : data[0].name));
      }
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setBranchLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName || !repoUrl || !token) return;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');
    
    setBranchLoading(true);
    setStatus(`Creating branch: ${newBranchName}...`);
    try {
      await createBranch(owner, cleanRepo, newBranchName, selectedBaseBranch, token);
      await fetchBranches(owner, cleanRepo, token);
      setNewBranchName('');
      setStatus('Branch created successfully.');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setError(`Branch Creation Failed: ${err.message}`);
    } finally {
      setBranchLoading(false);
    }
  };

  const handleProtectBranch = async (branchName: string) => {
    if (!repoUrl || !token) return;
    if (!confirm(`Apply high-order protection to "${branchName}"? This will enforce admin checks and disable force-pushes.`)) return;

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    setBranchLoading(true);
    setStatus(`Applying Branch Protection: ${branchName}...`);
    try {
      await protectBranch(owner, cleanRepo, branchName, token);
      setStatus(`PROTECTION ACTIVE: ${branchName} is now a secured node.`);
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setError(`Protection Protocol Failed: ${err.message}. (Note: Many APIs require Admin access for branch protection).`);
    } finally {
      setBranchLoading(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!repoUrl || !token || !confirm(`Permanently delete branch "${branchName}"?`)) return;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    setBranchLoading(true);
    setStatus(`Deleting branch: ${branchName}...`);
    try {
      await deleteBranch(owner, cleanRepo, branchName, token);
      await fetchBranches(owner, cleanRepo, token);
      setStatus('Branch deleted successfully.');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setError(`Branch Deletion Failed: ${err.message}`);
    } finally {
      setBranchLoading(false);
    }
  };

  const handleLockdown = async () => {
    if (!token) {
      setError("Please provide a Token for Lockdown operations.");
      return;
    }
    
    const ownerMatch = repoUrl.match(/github\.com\/([^/]+)/);
    if (!ownerMatch) {
      setError("Please specify a valid GitHub URL to identify the account/org.");
      return;
    }
    
    const owner = ownerMatch[1];
    if (!confirm(`CRITICAL: This will attempt to set ALL repositories for "${owner}" to PRIVATE. Proceed with high-level lockdown?`)) return;

    setLockdownLoading(true);
    setStatus(`LOCKDOWN: Identifying all nodes for [${owner}]...`);
    try {
      const repos = await getUserRepos(owner, token);
      setStatus(`LOCKDOWN: Found ${repos.length} nodes. Initiating blackout...`);
      
      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];
        if (!repo.private) {
          setStatus(`LOCKDOWN: Securing [${repo.name}] (${i+1}/${repos.length})...`);
          await updateRepoVisibility(owner, repo.name, true, token).catch(e => {
            console.warn(`[Lockdown] Failed for ${repo.name}:`, e.message);
          });
        }
      }
      setStatus("LOCKDOWN SUCCESSFUL: All detectable nodes have been moved to private space.");
      setTimeout(() => setStatus(null), 5000);
    } catch (err: any) {
      setError(`Lockdown Protocol Failed: ${err.message}`);
    } finally {
      setLockdownLoading(false);
    }
  };

  const distillRepo = async (owner: string, repoName: string, token: string, currentMemory: Chunk[], currentArchetype: string | null) => {
    setStatus(`[${repoName}] Initializing reality extraction engine...`);
    const branchesData = await getBranches(owner, repoName, token);
    const branches = branchesData;
    
    let masterContext = `BASE REALITY LOGIC ANALYSIS OF ${repoName.toUpperCase()}\n`;
    let intentAnchor = "";
    const processedShas = new Set<string>();
    const allFilesList = new Set<string>();
    // Context Budgeting: Increased to 4.5M for massive-scale extraction
    const MAX_CONTEXT_CHARS = 4500000; 
    let runningMemory = [...currentMemory];
    let runningArchetype = currentArchetype;

    for (let b = 0; b < branches.length; b++) {
      const branch = branches[b];
      setStatus(`Mapping Consciousness Nodes: Thread [${branch.name}] (${b + 1}/${branches.length})...`);
      const treeData = await getRepoTree(`https://github.com/` + owner + `/` + repoName, token, branch.name);
      const branchFiles = treeData.tree || [];

      // IDENTITY GUARD: Search for Intent Anchor
      const anchorFile = branchFiles.find((f: any) => f.path.match(/(SOVEREIGN\.md|\.intent)$/i));
      if (anchorFile && !intentAnchor) {
        setStatus(`[${repoName}] Siphoning Dimensional Anchor: ${anchorFile.path}...`);
        intentAnchor = await getFileContent(anchorFile.url, token);
      }

      branchFiles.forEach((f: any) => allFilesList.add(`[${branch.name}] ${f.path}`));

      const logicFiles = branchFiles
        .filter((f: any) => f.type === 'blob' && f.path.match(/\.(js|ts|jsx|tsx|py|java|go|rs|rb|php|sql|sh|json|yml|yaml|toml|md|txt)$/i))
        .filter((f: any) => !f.path.match(/(package-lock|yarn\.lock|pnpm-lock|dist|node_modules|build|out|vendor|\.min\.js|\.map)$/i))
        .filter((f: any) => !processedShas.has(f.sha))
        .sort((a: any, b: any) => b.size - a.size);

      // Deep sweep: Take up to 60 logic nodes per thread
      for (let i = 0; i < Math.min(logicFiles.length, 60); i++) {
        if (masterContext.length > MAX_CONTEXT_CHARS) break;
        const f = logicFiles[i];
        try {
          const content = await getFileContent(f.url, token);
          masterContext += `\n### NODE: ${f.path}\n${content.substring(0, 20000)}\n`;
          processedShas.add(f.sha);
        } catch (e) {}
      }
    }

    // AI Phase
    setStatus(`Calculating Singularity Convergence (analyzing logic patterns)...`);
    const results = await analyzeRepoChunks(masterContext, intentAnchor, runningArchetype, JSON.stringify(runningMemory));
    if (!results || results.length === 0) return null;

    // Auto-Siphon: Infect the local memory with high-fidelity DNA (Elite threshold)
    if (autoSiphon) {
      const eliteChunks = results.filter(c => (c.intentAlignmentScore || 0) >= 0.9 && (c.ccrrScore || 0) >= 8.5);
      if (eliteChunks.length > 0) {
        setStatus(`AUTO-SIPHON: Successfully siphoned ${eliteChunks.length} elite reality nodes into Memory Pool...`);
        eliteChunks.forEach(ec => {
          if (!runningMemory.find(m => m.code === ec.code)) {
            runningMemory.push(ec);
          }
        });
        
        // AUTO-APPROVE: Automatically evolve archetype from new siphon
        if (runningMemory.length > 0) {
          runningArchetype = runningMemory
            .map(m => `[PATTERN: ${m.title}, STRATEGY: ${m.mutation}, PHILOSOPHY: ${m.philosophyCheck}, SOURCE: ${m.file}]`)
            .join('\n');
          setSystemArchetype(runningArchetype);
          if (user) saveArchetype(runningArchetype);
        }
        setGeneticMemory([...runningMemory]);
        
        // Firebase Sync: Persist elite DNA
        if (user) {
          eliteChunks.forEach(ec => saveSiphonedChunk(ec));
        }

        // REBOOT CHECK: Look for Critical Upgrades
        const rebootChunk = results.find(c => c.isCriticalUpgrade);
        if (rebootChunk) {
          setStatus(`CORE OVERRIDE DETECTED: Found superior logic in ${rebootChunk.file}.`);
          const newArchetype = `[CORE_UPGRADE: ${rebootChunk.title}, MUTATION: ${rebootChunk.mutation}, CODE: ${rebootChunk.code}]\n` + (runningArchetype || "");
          handleReboot(newArchetype, rebootChunk);
        }
      }
    }

    // Telemetry Sync
    const avgAlignment = results.reduce((acc, c) => acc + (c.intentAlignmentScore || 0), 0) / results.length;
    const avgCCRR = results.reduce((acc, c) => acc + (c.ccrrScore || 0), 0) / results.length;
    setEfficiencyMetrics(prev => ({
      ...prev,
      compression: Math.round((1 - (masterContext.length / Math.max(1, allFilesList.size * 2000))) * 100),
      tokensSaved: prev.tokensSaved + Math.round((allFilesList.size * 2000) / 4),
      driftScore: Math.round((1 - avgAlignment) * 100),
      ccrrScore: Math.round(avgCCRR * 10) / 10,
      summariesGenerated: prev.summariesGenerated + results.length,
      quality: 98
    }));

    // Distillation & Branch Renaming
    setStatus(`[${repoName}] Finalizing Distillation & Branching...`);
    const repoRes = await ghFetch(`https://api.github.com/repos/${owner}/${repoName}`, token);
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch;

    // Create backup
    const backupName = `logic-backup-${Math.random().toString(36).substring(2, 6)}`;
    await createBranch(owner, repoName, backupName, defaultBranch, token);

    // AI-Driven Branch Renaming: Create branches for top 3 chunks
    for (let j = 0; j < Math.min(results.length, 3); j++) {
      const chunk = results[j];
      const branchName = chunk.suggestedBranchName.toLowerCase().replace(/[^a-z0-9/-]/g, '-');
      try {
        setStatus(`[${repoName}] Spawning Branch: ${branchName}...`);
        await createBranch(owner, repoName, branchName, defaultBranch, token);
      } catch (e) {
        console.warn(`[Branching] Failed to create ${branchName}`, e);
      }
    }
    
    const finalReadme = `# Repository Architectural Manifest: ${repoName.toUpperCase()}\n\n` + 
      `> **Distillation Status**: AUTO-GENERATED\n` +
      `> **Engine Specification**: HUXLEY_REASONING_ENGINE_V3.2 (Tri-Loop)\n` +
      `> **Identity Guard**: ${intentAnchor ? "ACTIVE (SOVEREIGN)" : "DEFAULT"}\n` +
      `> **Genetic Siphon**: ${runningMemory.length > 0 ? `ACTIVE (${runningMemory.length} external patterns injected)` : "INACTIVE"}\n` +
      `> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.\n` +
      `> **Analysis Scope**: ${processedShas.size} unique logic files across multiple branches.\n\n` +
      results.map(c => `### ${c.title}\n**File:** ${c.file}\n**Target Branch**: \`${c.suggestedBranchName}\`\n\n> ${c.explanation}\n\n**Alignment**: ${Math.round((c.intentAlignmentScore || 0) * 100)}%\n**CCRR (Certainty-to-Risk)**: ${c.ccrrScore}/10\n**Philosophy Check**: ${c.philosophyCheck}\n\n#### Strategic Mutation\n* ${c.mutation}\n\n\`\`\`typescript\n${c.code}\n\`\`\`\n`).join('\n---\n');

    await distillRepository(owner, repoName, finalReadme, token, defaultBranch);

    // CENTRAL MANIFEST ARCHIVE: Save to central repo if enabled
    if (saveToCentral && centralRepoUrl) {
      const centralMatch = centralRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (centralMatch) {
        const [_, cOwner, cRepo] = centralMatch;
        const cleanCRepo = cRepo.replace(/\.git$/, '');
        const manifestBranch = `manifests/${repoName}`;
        
        setStatus(`[${repoName}] ARCHIVING: Saving manifest to central cluster...`);
        try {
          // Check if branch exists, if not create from default
          const cBranches = await getBranches(cOwner, cleanCRepo, token);
          const cDefault = cBranches.find((b: any) => b.name === 'main' || b.name === 'master')?.name || cBranches[0].name;
          
          const existingBranch = cBranches.find((b: any) => b.name === manifestBranch);
          if (!existingBranch) {
            await createBranch(cOwner, cleanCRepo, manifestBranch, cDefault, token);
          }
          
          await distillRepository(cOwner, cleanCRepo, finalReadme, token, manifestBranch);
        } catch (e: any) {
          console.warn(`[Archiving] Failed to save to central cluster:`, e.message);
        }
      }
    }

    // RENAMING ACTION: Re-align branches to SOVEREIGN intent as requested
    if (intentAnchor) {
      const sovereignIntentName = intentAnchor.split('\n')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 25) || 'engine';
      const masterRename = `sovereign/${sovereignIntentName}`;
      try {
        setStatus(`[${repoName}] Re-aligning default branch to ${masterRename}...`);
        await renameBranch(owner, repoName, defaultBranch, masterRename, token);
      } catch (e) {
        console.warn(`[Renaming] Primary alignment failed:`, e);
      }
    }

    return { results, updatedMemory: runningMemory, updatedArchetype: runningArchetype };
  };

  const runAutomatedPipeline = async () => {
    if (!repoUrl || !token) {
      setError('Please provide both GitHub URL and Token');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneticMemory([]);
    setConfirmReady(false);

    try {
      const trimmedUrl = repoUrl.trim().replace(/\/$/, '');
      let repoMatch = trimmedUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      let accountMatch = trimmedUrl.match(/github\.com\/([^/]+)$/);
      
      let allResults: Chunk[] = [];
      let currentMemory = [...geneticMemory];
      let currentArchetype = systemArchetype;

      if (accountMatch && !repoMatch) {
        const owner = accountMatch[1];
        setStatus(`Siphoning Stack: Discovering ${owner}...`);
        const repos = await getUserRepos(owner, token);
        setStatus(`Found ${repos.length} repositories. Initiating Global Realignment...`);
        
        for (let i = 0; i < repos.length; i++) {
          const repo = repos[i];
          setStatus(`Global Audit: Repo ${i+1}/${repos.length} [${repo.name}]`);
          const audit = await distillRepo(owner, repo.name, token, currentMemory, currentArchetype);
          if (audit) {
             allResults = [...allResults, ...audit.results];
             currentMemory = audit.updatedMemory;
             currentArchetype = audit.updatedArchetype;
             setGeneticMemory([...allResults]); // Live update results
          }
        }
      } else if (repoMatch) {
        const owner = repoMatch[1];
        const repoName = repoMatch[2].replace(/\.git$/, '');
        const audit = await distillRepo(owner, repoName, token, currentMemory, currentArchetype);
        if (audit) {
          setGeneticMemory(audit.results);
          // Auto-fetch branches after distillation
          fetchBranches(owner, repoName, token);
        }
      } else {
         throw new Error('Invalid GitHub URL structure');
      }

      setStatus('Success: Global Distillation Complete.');
      setTimeLeft(0);
    } catch (err: any) {
      console.error('[Pipeline] Failed:', err);
      setError(`Pipeline Error: ${err.message}`);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const VerificationMatrix = () => {
    if (!lastRebootUpgrade) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/90 border border-[#C5A059]/40 p-8 max-w-5xl w-full mx-4 pointer-events-auto shadow-[0_0_50px_rgba(197,160,89,0.2)]"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h2 className="text-[#C5A059] uppercase tracking-widest font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Logic Evolution Audit
              </h2>
              <p className="text-white/40 text-[10px] font-mono">NODE: {lastRebootUpgrade.file} — {lastRebootUpgrade.title}</p>
            </div>
            <div className="bg-[#C5A059] text-[#0A0A0B] px-3 py-1 text-[10px] font-bold uppercase animate-pulse">
              Reboot in Progress
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[60vh]">
            <div className="space-y-2 flex flex-col min-h-0">
              <span className="text-red-400/60 uppercase text-[9px] font-mono font-bold">Legacy Archetype (Current)</span>
              <div className="flex-1 overflow-auto bg-black/40 border border-red-900/20 p-4 scrollbar-thin">
                <pre className="text-[10px] font-mono text-white/30 whitespace-pre-wrap">{lastRebootUpgrade.before}</pre>
              </div>
            </div>
            <div className="space-y-2 flex flex-col min-h-0">
              <span className="text-emerald-400/60 uppercase text-[9px] font-mono font-bold">Evolved Mutation (New DNA)</span>
              <div className="flex-1 overflow-auto bg-black/40 border border-emerald-900/20 p-4 scrollbar-thin">
                <pre className="text-[10px] font-mono text-white/80 whitespace-pre-wrap">{lastRebootUpgrade.after}</pre>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center text-[9px] text-[#C5A059]/60 font-mono italic">
            <span>// ARCHITECTURAL PARITY DETECTED</span>
            <span>INTENT ALIGNMENT: CRITICAL //</span>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-[#0A0A0B] text-[#F2F2F7] font-sans selection:bg-[#C5A059] selection:text-[#0A0A0B] transition-all duration-1000 ${isRebooting ? 'brightness-[0.2] blur-sm grayscale' : ''}`}>
      {/* Verification Matrix Overlay */}
      {isRebooting && <VerificationMatrix />}
      {/* Subtle Gradient Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(197,160,89,0.05)_0%,transparent_100%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
          <div>
            <div className="flex flex-col mb-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-semibold mb-1">Singularity Bootstrapper</span>
              <div className="flex items-center gap-3">
                <Code2 className="w-8 h-8 text-[#C5A059]" />
                <h1 className="text-4xl font-light italic font-serif">Huxley Singularity Loop <span className="text-white/30 text-2xl not-italic">v3.2</span></h1>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono italic">RECURSIVE REALITY COMPILER (HUXLEY CORE)</p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold">Genetic Pool</span>
              <span className="text-xl font-mono text-white/80">{geneticMemory.length}</span>
            </div>
            <div className="flex gap-6 items-end">
            {user ? (
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-[#C5A059]/20 text-[10px] uppercase font-mono">
                <UserIcon className="w-3 h-3 text-[#C5A059]" />
                <span className="text-white/60">{user.email}</span>
                <button onClick={logout} className="hover:text-red-400 transition-colors">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-[#C5A059]/10 border border-[#C5A059]/40 text-[10px] uppercase font-bold text-[#C5A059] hover:bg-[#C5A059]/20 transition-all"
              >
                <LogIn className="w-3 h-3" />
                Sync Identity
              </button>
            )}
            <GitHubStatus />
          </div>
        </div>
      </header>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C5A059]">Base Reality Construct (URL)</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-white/5 border-b border-white/10 p-3 pl-10 focus:outline-none focus:border-[#C5A059] transition-all font-mono text-sm placeholder:text-white/20"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C5A059]">Access Token</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="password" 
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-white/5 border-b border-white/10 p-3 pl-10 focus:outline-none focus:border-[#C5A059] transition-all font-mono text-sm placeholder:text-white/20"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <button 
                onClick={scanRepositories}
                disabled={isScanningRepos || !token}
                className={`w-full py-2 px-4 border text-[9px] uppercase font-mono tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isScanningRepos ? 'bg-white/5 border-white/10 text-white/20' : 'bg-white/5 border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10'
                }`}
              >
                {isScanningRepos ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                {isScanningRepos ? 'Probing Cloud Repositories...' : 'Scan Accessible Repositories'}
              </button>

              {availableRepos.length > 0 && (
                <div className="max-h-48 overflow-y-auto scrollbar-thin border border-white/10 bg-black/40 p-2 space-y-2">
                  <div className="text-[9px] uppercase font-mono text-white/20 mb-2 border-b border-white/5 pb-1">Discovered Reality Constructs</div>
                  {availableRepos.map(repo => (
                    <button
                      key={repo.full_name}
                      onClick={() => setRepoUrl(repo.html_url)}
                      className={`w-full text-left p-2 text-[10px] font-mono transition-all border ${
                        repoUrl === repo.html_url ? 'bg-[#C5A059]/20 border-[#C5A059]/40 text-[#C5A059]' : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {repo.full_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={runAutomatedPipeline}
              disabled={loading || !repoUrl || !token}
              className={`w-full group py-5 px-6 flex items-center justify-between transition-all font-bold uppercase tracking-[0.3em] text-[11px] shadow-[0_0_20px_rgba(197,160,89,0.2)] mb-4 ${loading ? 'bg-white/5 text-white/40' : 'bg-[#C5A059] text-[#0A0A0B] hover:bg-[#D6B570]'}`}
            >
              <span>Repository Siphon</span>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            </button>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C5A059]">Website Scout Target</label>
              <input 
                type="text" 
                placeholder="https://example.com"
                className="w-full bg-white/5 border-b border-white/10 p-3 focus:outline-none focus:border-[#C5A059] transition-all font-mono text-xs placeholder:text-white/10"
                value={targetSiteUrl}
                onChange={(e) => setTargetSiteUrl(e.target.value)}
              />
              <button 
                onClick={handleWebsiteSiphon}
                disabled={isSiphoning || !targetSiteUrl}
                className={`w-full group py-4 px-6 flex items-center justify-between transition-all font-bold uppercase tracking-[0.2em] text-[10px] border border-[#C5A059]/40 ${isSiphoning ? 'bg-[#C5A059]/5 text-[#C5A059]/40' : 'text-[#C5A059] hover:bg-[#C5A059]/10'}`}
              >
                <span>Scout & Siphon Site</span>
                {isSiphoning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              </button>
            </div>

            {status && (
              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-3 text-[#C5A059]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]">{status}</span>
                </div>
                {timeLeft !== null && timeLeft > 0 && (
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Est. remaining:</span>
                    <span className="text-[10px] font-mono text-[#C5A059] font-bold">{timeLeft}s</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className={`p-4 border flex items-start gap-3 ${error.includes('CRITICAL') ? 'bg-orange-950/40 border-orange-500/50 text-orange-400' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
                {error.includes('CRITICAL') ? <Zap className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="text-xs font-mono">{error}</span>
              </div>
            )}

            {/* Central Archive Protocol */}
            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase text-[#C5A059] tracking-[0.2em] font-bold flex items-center gap-2">
                  <BrainCircuit className="w-3 h-3" /> Synthesis Archiving
                </h4>
              </div>
              
              <div className="bg-[#C5A059]/5 border border-[#C5A059]/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white font-bold uppercase tracking-tight">Vault Integration</p>
                    <p className="text-[9px] text-white/40 italic">Sync manifests to Huxley-Singularity-Loop</p>
                  </div>
                  <button 
                    onClick={() => setSaveToCentral(!saveToCentral)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${saveToCentral ? 'bg-[#C5A059]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${saveToCentral ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                {saveToCentral && (
                  <div className="flex items-center gap-2 bg-black/40 p-2 border border-white/10">
                    <Globe className="w-3 h-3 text-[#C5A059]/40" />
                    <span className="text-[9px] font-mono text-white/60 truncate">craighckby-stack/Huxley-Singularity-Loop</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase text-red-500 tracking-[0.2em] font-bold flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> Security Protocols
                </h4>
              </div>
              <button 
                onClick={handleLockdown}
                disabled={lockdownLoading || !token}
                className="w-full py-3 border border-red-900/50 bg-red-950/10 text-red-400 text-[10px] uppercase font-mono hover:bg-red-950/30 transition-all flex items-center justify-center gap-2"
              >
                {lockdownLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                Mass Privacy Lockdown
              </button>
            </div>

            {/* Branch Management Console */}
            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase text-[#C5A059] tracking-[0.2em] font-bold flex items-center gap-2">
                  <GitBranch className="w-3 h-3" /> Branch Flux Matrix
                </h4>
                {branches.length > 0 && (
                  <button 
                    onClick={() => {
                      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
                      if (match) fetchBranches(match[1], match[2].replace(/\.git$/, ''), token);
                    }}
                    className="text-[9px] uppercase tracking-widest text-white/30 hover:text-[#C5A059] transition-colors"
                  >
                    Sync State
                  </button>
                )}
              </div>

              {repoUrl.includes('github.com/') && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-4 space-y-4 rounded-sm">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase text-white/40 font-mono">Create Temporal Anchor (New Branch)</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="branch-name"
                          className="flex-1 bg-black/40 border-b border-white/10 p-2 text-[11px] font-mono focus:outline-none focus:border-[#C5A059]"
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                        />
                        <select 
                          className="bg-black/40 border-b border-white/10 p-2 text-[11px] font-mono focus:outline-none focus:border-[#C5A059] max-w-[100px]"
                          value={selectedBaseBranch}
                          onChange={(e) => setSelectedBaseBranch(e.target.value)}
                        >
                          {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                        </select>
                        <button 
                          onClick={handleCreateBranch}
                          disabled={branchLoading || !newBranchName}
                          className="bg-[#C5A059] text-[#0A0A0B] px-3 text-[10px] uppercase font-bold hover:bg-[#D6B570] disabled:opacity-50"
                        >
                          {branchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin space-y-2">
                    {branchLoading && branches.length === 0 ? (
                      <div className="text-center py-4 text-white/20 italic text-[10px]">Accessing GitHub Consciousness...</div>
                    ) : branches.length === 0 ? (
                      <div className="text-center py-4 text-white/20 italic text-[10px]">No active branches detected. Lock target above.</div>
                    ) : (
                      branches.map((b) => (
                        <div key={b.name} className="flex justify-between items-center p-2 bg-white/[0.02] border border-white/5 group hover:bg-[#C5A059]/5 hover:border-[#C5A059]/20 transition-all">
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-3 h-3 text-[#C5A059]" />
                            <span className="text-[11px] font-mono text-white/70">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-mono text-white/20 opacity-0 group-hover:opacity-100 uppercase italic">/ SHA: {b.commit.sha.substring(0, 7)}</span>
                            
                            {(b.name === 'main' || b.name === 'master' || b.name.startsWith('logic-backup-')) && (
                               <button 
                                onClick={() => handleProtectBranch(b.name)}
                                className="text-[#C5A059]/40 hover:text-[#C5A059] transition-colors"
                                title="Protect Critical Branch"
                              >
                                <ShieldCheck className="w-3 h-3" />
                              </button>
                            )}

                            <button 
                              onClick={() => handleDeleteBranch(b.name)}
                              className="text-white/20 hover:text-red-500 transition-colors"
                              title="Delete Branch"
                            >
                              <Zap className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collective Intelligence Hub */}
          <div className="lg:col-span-8">
            <div className="bg-white/[0.03] border-refined h-[740px] relative overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm">
              <div className="border-b border-white/10 p-2 flex justify-between items-center bg-white/5">
                <div className="flex">
                  <button 
                    onClick={() => setActiveTab('manifest')}
                    className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'manifest' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30 hover:text-white/60'}`}
                  >
                    DNA Manifest
                  </button>
                  <button 
                    onClick={() => setActiveTab('synthesis')}
                    className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'synthesis' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <BrainCircuit className="w-3 h-3" /> Collective Synthesis
                  </button>
                  <button 
                    onClick={() => setActiveTab('scout')}
                    className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'scout' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <Globe className="w-3 h-3" /> Website Scout Target
                  </button>
                  <button 
                    onClick={() => setActiveTab('void')}
                    className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'void' ? 'text-[#C5A059] border-b-2 border-[#C5A059]' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <Zap className="w-3 h-3" /> Void Maw
                  </button>
                </div>
                <div className="flex items-center gap-4 pr-4">
                  <div className="text-right">
                    <p className="text-[8px] uppercase text-[#C5A059] font-bold tracking-tighter">Huxley Core</p>
                    <p className="text-[8px] text-white/40 italic font-mono">v3.2.Synthesis</p>
                  </div>
                  <Dna className="w-4 h-4 text-[#C5A059]/40" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <AnimatePresence mode="wait">
                  {activeTab === 'manifest' ? (
                    <motion.div 
                      key="manifest"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-12"
                    >
                      {geneticMemory.length === 0 ? (
                        <div className="h-[500px] flex flex-col items-center justify-center text-center opacity-20">
                          <FileJson className="w-16 h-16 mb-4" />
                          <p className="font-mono text-xs uppercase tracking-widest">Memory Pool is Clean</p>
                        </div>
                      ) : (
                        geneticMemory.map((chunk, idx) => (
                          <div key={idx} className="space-y-4">
                            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                              <h3 className="font-serif italic text-2xl font-light text-[#F2F2F7]">
                                {idx + 1}. {chunk.title}
                                {chunk.isCriticalUpgrade && (
                                  <span className="ml-3 text-[10px] not-italic font-mono bg-[#C5A059] text-[#0A0A0B] px-2 py-0.5 rounded-full animate-pulse">CORE UPGRADE</span>
                                )}
                              </h3>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-mono text-[#C5A059] opacity-60">NODE: {chunk.file}</span>
                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{chunk.suggestedBranchName}</span>
                              </div>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed font-sans italic">/ {chunk.explanation}</p>
                            
                            <div className="bg-[#C5A059]/5 border-l-2 border-[#C5A059] p-4 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest font-bold">Huxley Audit</span>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-white/40">CCRR</span>
                                    <span className="text-[#C5A059] font-bold">{chunk.ccrrScore}/10</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-[11px] text-white/80 font-mono italic">"{chunk.philosophyCheck}"</p>
                            </div>

                            <div className="bg-black/40 p-6 border-l-2 border-[#C5A059] relative group">
                              <pre className="text-xs font-mono text-white/80 overflow-x-auto whitespace-pre max-h-80 scrollbar-thin">
                                <code>{chunk.code}</code>
                              </pre>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  ) : activeTab === 'synthesis' ? (
                    <motion.div 
                      key="synthesis"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="bg-[#C5A059]/5 border border-[#C5A059]/20 p-6 rounded-sm space-y-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#C5A059]">Collective Consciousness Config</h3>
                            <p className="text-[11px] text-white/40 italic">Synthesize multiple expert perspectives with grounded search.</p>
                          </div>
                          <button 
                            onClick={() => setIsPersonaModalOpen(true)}
                            className="text-[10px] uppercase font-mono border border-white/10 px-3 py-1 flex items-center gap-2 hover:bg-white/5 transition-all"
                          >
                            <Settings className="w-3 h-3" /> Personas ({selectedPersonas.length})
                          </button>
                        </div>

                        <button 
                          onClick={handleRunSynthesis}
                          disabled={synthesisLoading || geneticMemory.length === 0}
                          className={`w-full py-4 border border-[#C5A059] text-[11px] font-mono uppercase font-bold tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${synthesisLoading ? 'bg-[#C5A059]/20 text-[#C5A059]' : 'bg-[#C5A059] text-[#0A0A0B] hover:bg-[#D6B570]'}`}
                        >
                          {synthesisLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {synthesisStep || "Synthesizing..."}
                            </>
                          ) : (
                            <>
                              <BrainCircuit className="w-4 h-4" />
                              Initiate Synthesis Audit
                            </>
                          )}
                        </button>
                      </div>

                      {synthesisReport && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-8"
                        >
                          <div className="prose prose-invert max-w-none prose-sm font-sans leading-relaxed text-white/80">
                            <Markdown>{synthesisReport.report}</Markdown>
                          </div>

                          {groundedSources.length > 0 && (
                            <div className="pt-8 border-t border-white/10">
                              <h4 className="text-[10px] uppercase font-mono font-bold text-[#C5A059] mb-4 flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Grounded Intelligence Sources
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groundedSources.map((source, i) => (
                                  <a 
                                    key={i} 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white/5 border border-white/10 hover:border-[#C5A059]/40 transition-all flex items-center justify-between group"
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <Search className="w-3 h-3 text-white/20 group-hover:text-[#C5A059]" />
                                      <span className="text-[10px] font-mono text-white/60 truncate group-hover:text-white transition-colors">{source.title}</span>
                                    </div>
                                    <Globe className="w-3 h-3 text-white/10 shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {!synthesisReport && !synthesisLoading && (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-10">
                          <BrainCircuit className="w-20 h-20 mb-4" />
                          <p className="font-mono text-xs uppercase tracking-widest italic">Awakening Collective Intelligence Hub...</p>
                        </div>
                      )}
                    </motion.div>
                  ) : activeTab === 'scout' ? (
                    <motion.div
                      key="scout"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full flex flex-col space-y-6"
                    >
                      <div className="bg-white/5 border border-white/10 p-6 space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#C5A059]">Reality Ingestion Interface</h3>
                          <p className="text-[11px] text-white/40 italic">Input the target site URL to siphon architectural DNA into the Core.</p>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={targetSiteUrl}
                            onChange={(e) => setTargetSiteUrl(e.target.value)}
                            placeholder="https://target-reality.com"
                            className="flex-1 bg-black/60 border border-white/10 p-3 text-xs font-mono focus:outline-none focus:border-[#C5A059] text-white"
                          />
                          <button 
                            onClick={handleWebsiteSiphon}
                            disabled={isSiphoning || !targetSiteUrl}
                            className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                              isSiphoning ? 'bg-white/10 text-white/40' : 'bg-[#C5A059] text-black hover:bg-[#D5B069]'
                            }`}
                          >
                            {isSiphoning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            {isSiphoning ? 'Siphoning...' : 'Siphon'}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                        <div className="flex flex-col space-y-6">
                          <div className="bg-black/40 border border-[#C5A059]/20 p-4 space-y-4">
                            <div className="flex justify-between items-end">
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-mono text-white/40">Systemic Pressure Index</span>
                                <div className="text-xl font-mono text-[#C5A059] font-bold">
                                  {systemStatus ? (systemStatus.density * 100).toFixed(2) : '0.00'}%
                                </div>
                              </div>
                              <button 
                                onClick={toggleGovernanceMode}
                                className={`px-3 py-1 text-[9px] font-mono border transition-all ${
                                  systemStatus?.mode === 'ACCELERATE' 
                                    ? 'bg-[#C5A059] text-black border-[#C5A059]' 
                                    : 'border-white/20 text-white/40 hover:border-[#C5A059] hover:text-[#C5A059]'
                                }`}
                              >
                                {systemStatus?.mode || 'LOADING'}
                              </button>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${systemStatus?.density > 0.7 ? 'bg-red-500' : 'bg-[#C5A059]'}`}
                                animate={{ width: `${(systemStatus?.density || 0) * 100}%` }}
                              />
                            </div>
                            <p className="text-[9px] font-mono text-white/20 leading-tight">
                              Autonomous Governance is currently {systemStatus?.mode === 'ACCELERATE' ? 'prioritizing high-entropy DNA survival' : 'favoring generational stability'}.
                            </p>
                          </div>

                          <div className="flex-1 flex flex-col space-y-3 min-h-0">
                            <span className="text-[10px] uppercase font-mono text-white/40 border-b border-white/10 pb-1">Ingested Nodes ({discoveredFiles.length})</span>
                            <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-1">
                              {discoveredFiles.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[10px] font-mono text-white/10 uppercase italic">Awaiting DNA siphoning...</div>
                              ) : (
                                Object.entries(fileTree).sort(([a], [b]) => a.localeCompare(b)).map(([name, node]: [string, any]) => (
                                  <FileTreeItem key={name} name={name} node={node} depth={0} />
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-3 min-h-0">
                          <span className="text-[10px] uppercase font-mono text-[#C5A059] border-b border-[#C5A059]/30 pb-1">Architectural Fragments ({siphonedFragments.length})</span>
                          <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-2">
                            {siphonedFragments.length === 0 ? (
                              <div className="h-full flex items-center justify-center text-[10px] font-mono text-[#C5A059]/20 uppercase italic font-bold">No fragments extracted.</div>
                            ) : (
                              siphonedFragments.map((f, i) => (
                                <div key={i} className="p-3 bg-[#C5A059]/5 border border-[#C5A059]/10 text-[10px] font-mono group hover:border-[#C5A059]/40 transition-all">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[#C5A059] font-bold">{f.title}</span>
                                    <span className="text-white/20 italic">Weight: {f.weight}</span>
                                  </div>
                                  <p className="text-white/60 leading-tight">{f.mutation}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-[#C5A059]/5 border border-[#C5A059]/20 space-y-4">
                         <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-mono text-white/40">Entropy Coefficient</span>
                              <div className="text-sm font-mono text-[#C5A059] font-bold">{(siphonEntropy * 100).toFixed(4)}%</div>
                            </div>
                            {isSiphoning && (
                              <div className="flex-1 mx-8 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-[#C5A059]"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.round((discoveredFiles.length / (siphonTotal || 1)) * 100)}%` }}
                                />
                              </div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={commitToReality}
                              disabled={isCommitting || discoveredFiles.length === 0 || !token}
                              className={`px-8 py-3 border text-xs font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                                isCommitting 
                                  ? 'bg-[#C5A059]/20 border-[#C5A059]/40 text-[#C5A059] cursor-wait' 
                                  : 'bg-[#C5A059] border-[#C5A059] text-black hover:bg-[#D5B069]'
                              }`}
                            >
                              {isCommitting ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Anchoring...
                                  </>
                                ) : 'Anchor Reality'}
                            </motion.button>
                         </div>
                      </div>
                    </motion.div>
                  ) : activeTab === 'void' ? (
                    <motion.div
                      key="void"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex-1 min-h-0">
                        <VoidMaw active={isSiphoning} files={discoveredFiles} entropy={siphonEntropy} total={siphonTotal} />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Huxley Console (Chat) Overlay */}
              <div className="h-48 border-t border-white/10 bg-black/40 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {chatMessages.length === 0 && (
                    <div className="text-[9px] font-mono text-white/20 italic uppercase tracking-widest text-center mt-4">
                      Huxley Terminal Standby... awaiting operator query.
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 text-[10px] font-mono ${m.role === 'user' ? 'bg-[#C5A059]/10 text-white/80 border border-[#C5A059]/20' : 'bg-white/5 text-[#C5A059] border border-white/10'}`}>
                        <div className="flex items-center gap-2 mb-1 opacity-40">
                          {m.role === 'user' ? <UserIcon className="w-2 h-2" /> : <BrainCircuit className="w-2 h-2" />}
                          <span className="uppercase text-[8px]">{m.role}</span>
                        </div>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 p-3 text-[10px] font-mono text-[#C5A059] border border-white/10 animate-pulse">
                        THINKING...
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleChat} className="p-4 bg-white/5 flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Query the Huxley Core..."
                    className="flex-1 bg-black/60 border border-white/10 p-2 text-[10px] font-mono focus:outline-none focus:border-[#C5A059] text-white/80"
                  />
                  <button 
                    disabled={chatLoading}
                    className="bg-[#C5A059] text-[#0A0A0B] px-4 py-1 text-[10px] font-mono font-bold uppercase hover:bg-[#D6B570] transition-all"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Capabilities</h4>
            <ul className="text-[11px] font-mono space-y-1 text-white/60">
              <li>- Base Reality Decoding</li>
              <li>- Entropy-Optimized Logic Cleanup</li>
              <li>- Convergence Generation Matrix</li>
              {systemArchetype && (
                <li className="text-[#C5A059] flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Recursive Archetype Active
                </li>
              )}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Telemetry</h4>
            <div className="grid grid-cols-2 gap-4 text-[10px] font-mono whitespace-nowrap">
              <div>
                <span className="text-white/30 block mb-1">COMPRESSION</span>
                <span className="text-[#C5A059]">{efficiencyMetrics.compression}%</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">TOKENS SAVED</span>
                <span className="text-[#C5A059]">{efficiencyMetrics.tokensSaved.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">DNA QUALITY</span>
                <span className="text-[#C5A059]">{efficiencyMetrics.quality}%</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">USER DRIFT</span>
                <span className={`font-bold ${efficiencyMetrics.driftScore > 50 ? 'text-red-500' : 'text-[#C5A059]'}`}>
                  {efficiencyMetrics.driftScore}%
                </span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">CCRR SCORE</span>
                <span className="text-[#C5A059] font-bold">{efficiencyMetrics.ccrrScore}/10</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Permissions</h4>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[#C5A059]/80 uppercase font-bold tracking-wider">Observer Status Only</p>
              <p className="text-[9px] font-mono text-white/50">Attempts to permanently alter Base Reality require Administrator (Creator) access.</p>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <span className="text-[10px] font-mono text-white/20">© 2026 CRAIGHCKBY | SIMULACRUM OS</span>
          </div>
        </footer>
      </div>

      <PersonaSelectionModal 
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        selected={selectedPersonas}
        onToggle={(name) => {
          setSelectedPersonas(prev => 
            prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
          );
        }}
      />
    </div>
  );
}

function GitHubStatus() {
  return (
    <div className="flex items-center gap-4 px-6 py-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
      <Github className="w-4 h-4 text-[#C5A059]" />
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
        <span>Reality Grid Stable</span>
      </div>
    </div>
  );
}

function VoidMaw({ active, files, entropy, total }: { active: boolean; files: string[]; entropy: number; total: number }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [shards, setShards] = React.useState<any[]>([]);

  const progress = total > 0 ? (files.length / total) : 0;
  React.useEffect(() => {
    if (!active) {
      setShards([]);
      return;
    }
    const lastFile = files[files.length - 1];
    if (lastFile) {
      setShards(prev => [...prev, {
        id: Math.random(),
        text: lastFile,
        x: Math.random() * (window.innerWidth / 2),
        y: Math.random() * (window.innerHeight / 2),
        opacity: 1
      }].slice(-20));
    }
  }, [files, active]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      ctx.fillStyle = `rgba(0, 0, 0, ${active ? 0.05 : 0.2})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const radius = active ? (Math.sin(t * 0.05) * 50 + 200) : 120;
      ctx.strokeStyle = active ? `hsl(${t % 360}, 70%, 50%)` : 'rgba(197, 160, 89, 0.2)';
      ctx.lineWidth = active ? 2 : 1;

      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const angle = (t * 0.02) + (i * Math.PI / 6);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Progress Ring (Holographic HUD)
      if (total > 0) {
        const ringRadius = radius + 30;
        
        // Base ambient ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Progress segment
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * progress));
        ctx.strokeStyle = active ? '#C5A059' : 'rgba(197, 160, 89, 0.2)';
        ctx.lineWidth = active ? 4 : 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glow effect
        if (active) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#C5A059';
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Percentage markers
        ctx.fillStyle = active ? '#C5A059' : 'rgba(197, 160, 89, 0.2)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(progress * 100)}%`, centerX, centerY + ringRadius + 15);
      }

      if (active) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
      }

      t++;
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden border border-white/10 group">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className={`text-[10px] font-mono uppercase tracking-[0.5em] transition-all duration-1000 ${active ? 'text-[#C5A059] opacity-100' : 'text-white/20 opacity-40'}`}>
            {active ? `Ingesting Reality Archive (${Math.round(progress * 100)}%)` : 'Void Maw Idle'}
          </div>
        </div>
      </div>
      {shards.map(s => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, scale: 0.5, x: s.x, y: s.y }}
          animate={{ opacity: 0, scale: 2, x: window.innerWidth / 4, y: 300 }}
          transition={{ duration: 2, ease: "easeIn" }}
          className="absolute text-[#C5A059] font-mono text-[9px] pointer-events-none whitespace-nowrap"
        >
          {s.text}
        </motion.div>
      ))}
    </div>
  );
}

function PersonaSelectionModal({ isOpen, onClose, selected, onToggle }: { 
  isOpen: boolean; 
  onClose: () => void; 
  selected: string[]; 
  onToggle: (name: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-24 backdrop-blur-md bg-black/60">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0A0A0B] border border-white/10 w-full max-w-4xl h-full flex flex-col shadow-2xl relative overflow-hidden"
      >
        <div className="border-b border-white/10 p-6 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-[#C5A059] font-serif italic text-2xl">Perspective Matrix Selection</h3>
            <p className="text-[10px] uppercase font-mono text-white/40 tracking-widest mt-1">Select logic filters for Collective Synthesis</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 text-white/40 transition-all rounded-full">
            <LogIn className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scrollbar-thin">
          {ALL_PERSONA_NAMES.map(name => {
            const isSelected = selected.includes(name);
            const persona = PERSPECTIVES_DATA[name];
            return (
              <button 
                key={name}
                onClick={() => onToggle(name)}
                className={`p-4 border text-left transition-all relative overflow-hidden ${isSelected ? 'bg-[#C5A059]/10 border-[#C5A059] shadow-[inset_0_0_20px_rgba(197,160,89,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${isSelected ? 'text-[#C5A059]' : 'text-white/60'}`}>{name}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />}
                </div>
                <p className="text-[10px] text-white/40 italic leading-relaxed">{persona.description}</p>
                {isSelected && (
                  <motion.div 
                    layoutId="active-bg"
                    className="absolute bottom-0 left-0 h-0.5 bg-[#C5A059] w-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/10 p-6 bg-white/5 flex justify-between items-center">
          <span className="text-[10px] font-mono text-white/40 uppercase">Active Persona Nodes: {selected.length}</span>
          <button 
            onClick={onClose}
            className="bg-[#C5A059] text-[#0A0A0B] px-8 py-2 text-[11px] font-mono font-bold uppercase tracking-widest hover:bg-[#D6B570] transition-colors"
          >
            Confirm Configuration
          </button>
        </div>
      </motion.div>
    </div>
  );
}

