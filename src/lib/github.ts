/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/lib/github.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

export interface GitHubRepo {
  owner: { login: string };
  name: string;
  default_branch: string;
}

/**
 * Validates repository owner or name strings to prevent path traversal or injection.
 */
const sanitizeSegment = (value: string, fieldName: string): string => {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_.-]+$/.test(value)) {
    throw new Error(`Invalid GitHub ${fieldName}: must contain only alphanumeric characters, hyphens, periods, or underscores.`);
  }
  return value;
};

export const ghFetch = async (url: string, token: string, options: RequestInit = {}): Promise<Response> => {
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error("Authentication Error: GitHub token is required.");
  }

  if (typeof url !== 'string' || !url.startsWith('https://api.github.com/')) {
    throw new Error("Security Error: Invalid or untrusted request URL endpoint.");
  }

  const authHeader = `Bearer ${token.trim()}`;
  
  const headers: Record<string, string> = {
    'Authorization': authHeader,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers }).catch((e: unknown) => {
    if (e instanceof Error && e.message.includes('Failed to fetch')) {
      throw new Error("Network Error: Failed to connect to GitHub. Verify your credentials and internet connection.");
    }
    throw e;
  });

  if (response.status === 403 || response.status === 429) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');
    
    if (rateLimitRemaining === '0') {
      const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString() : 'soon';
      throw new Error(`CRITICAL: GitHub API rate limit exceeded. Reset at ${resetDate}. Operation halted.`);
    }
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || (errorData.errors ? JSON.stringify(errorData.errors) : response.statusText);
      if (response.status === 403 && errorMessage.toLowerCase().includes('protected branch')) {
        errorMessage = "Operation failed: The branch is PROTECTED. Please disable branch protection in repository settings to allow distillation.";
      }
    } catch {
      // Non-JSON error payload fallback
    }
    throw new Error(`GitHub API Error [${response.status}]: ${errorMessage}`);
  }
  return response;
};

export const getRepoTree = async (repoUrl: string, token: string, branch: string = 'main'): Promise<any> => {
  if (typeof repoUrl !== 'string') {
    throw new Error('Invalid repository URL');
  }
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL structure');
  const [, rawOwner, rawName] = match;
  const owner = sanitizeSegment(rawOwner, 'owner');
  const cleanName = sanitizeSegment(rawName.replace(/\.git$/, '').replace(/\/$/, ''), 'repository name');
  
  const encodedBranch = encodeURIComponent(branch);
  const res = await ghFetch(`https://api.github.com/repos/${owner}/${cleanName}/git/trees/${encodedBranch}?recursive=1`, token);
  return res.json();
};

export const getFileContent = async (url: string, token: string): Promise<string> => {
  if (typeof url !== 'string' || !url.startsWith('https://api.github.com/')) {
    throw new Error('Security Error: Invalid or untrusted file content URL endpoint.');
  }
  const res = await ghFetch(url, token);
  const data = await res.json() as { content?: string };
  
  if (!data || !data.content) return "";

  try {
    const sanitizedContent = data.content.replace(/\s/g, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(sanitizedContent)) {
      throw new Error('Malformed base64 content received.');
    }
    const binaryString = atob(sanitizedContent);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e: unknown) {
    console.warn(`[github] Failed to decode content for ${url}:`, e);
    return "/* [Error: Binary or malformed content could not be decoded] */";
  }
};

export const getUserRepos = async (owner: string, token: string): Promise<any> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  try {
    const res = await ghFetch(`https://api.github.com/users/${safeOwner}/repos?per_page=100&sort=updated`, token);
    return await res.json();
  } catch {
    const res = await ghFetch(`https://api.github.com/orgs/${safeOwner}/repos?per_page=100&sort=updated`, token);
    return await res.json();
  }
};

export const getBranches = async (owner: string, repo: string, token: string): Promise<any> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  const safeRepo = sanitizeSegment(repo, 'repo');
  const res = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/branches`, token);
  return res.json();
};

export const createBranch = async (owner: string, repo: string, newBranch: string, baseBranch: string, token: string): Promise<any> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  const safeRepo = sanitizeSegment(repo, 'repo');
  const safeNewBranch = sanitizeSegment(newBranch, 'newBranch');
  const safeBaseBranch = sanitizeSegment(baseBranch, 'baseBranch');
  console.log(`[createBranch] Creating [${safeNewBranch}] from [${safeBaseBranch}]`);
  
  const encodedBase = encodeURIComponent(safeBaseBranch);
  const baseRes = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/commits/${encodedBase}`, token);
  const baseData = await baseRes.json() as { sha: string };
  const sha = baseData.sha;

  try {
    const res = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/git/refs`, token, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${safeNewBranch}`,
        sha
      })
    });
    return await res.json();
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.warn(`[createBranch] Fallback triggered:`, errorMessage);
    const fallbackName = `backup-${Math.random().toString(36).substring(2, 7)}`;
    const res = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/git/refs`, token, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${fallbackName}`,
        sha
      })
    });
    return await res.json();
  }
};

export const distillRepository = async (owner: string, repo: string, readmeContent: string, token: string, branch: string): Promise<any> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  const safeRepo = sanitizeSegment(repo, 'repo');
  const safeBranch = sanitizeSegment(branch, 'branch');
  console.log(`[distillRepository] Distilling [${safeBranch}]`);
  
  const encodedBranch = encodeURIComponent(safeBranch);
  const commitRes = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/commits/${encodedBranch}`, token);
  const commitData = await commitRes.json() as { sha: string };
  const parentSha = commitData.sha;

  const blobRes = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/git/blobs`, token, {
    method: 'POST',
    body: JSON.stringify({
      content: btoa(unescape(encodeURIComponent(readmeContent))),
      encoding: 'base64'
    })
  });
  const blobData = await blobRes.json() as { sha: string };

  const treeRes = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({
      tree: [
        {
          path: 'README.md',
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        }
      ]
    })
  });
  const treeData = await treeRes.json() as { sha: string };

  const finalCommitRes = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message: 'chore: distill repository to logic manifest',
      tree: treeData.sha,
      parents: [parentSha]
    })
  });
  const finalCommitData = await finalCommitRes.json() as { sha: string };

  const encodedRef = encodeURIComponent(safeBranch);
  const updateRes = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/git/refs/heads/${encodedRef}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: finalCommitData.sha,
      force: true
    })
  });
  return updateRes.json();
};

export const renameBranch = async (owner: string, repo: string, oldBranch: string, newName: string, token: string): Promise<any> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  const safeRepo = sanitizeSegment(repo, 'repo');
  const safeOldBranch = sanitizeSegment(oldBranch, 'oldBranch');
  const safeNewName = sanitizeSegment(newName, 'newName');
  console.log(`[renameBranch] Renaming [${safeOldBranch}] to [${safeNewName}]`);
  const encodedBranch = encodeURIComponent(safeOldBranch);
  const res = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/branches/${encodedBranch}/rename`, token, {
    method: 'POST',
    body: JSON.stringify({ new_name: safeNewName })
  });
  return res.json();
};

export const deleteBranch = async (owner: string, repo: string, branch: string, token: string): Promise<Response> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  const safeRepo = sanitizeSegment(repo, 'repo');
  const safeBranch = sanitizeSegment(branch, 'branch');
  console.log(`[deleteBranch] Deleting [${safeBranch}]`);
  const encodedRef = encodeURIComponent(safeBranch);
  const res = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/git/refs/heads/${encodedRef}`, token, {
    method: 'DELETE'
  });
  return res;
};

export const updateRepoVisibility = async (owner: string, repo: string, isPrivate: boolean, token: string): Promise<any> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  const safeRepo = sanitizeSegment(repo, 'repo');
  console.log(`[updateRepoVisibility] Setting ${safeRepo} to ${isPrivate ? 'private' : 'public'}`);
  const res = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ private: isPrivate })
  });
  return res.json();
};

export const protectBranch = async (owner: string, repo: string, branch: string, token: string): Promise<any> => {
  const safeOwner = sanitizeSegment(owner, 'owner');
  const safeRepo = sanitizeSegment(repo, 'repo');
  const safeBranch = sanitizeSegment(branch, 'branch');
  console.log(`[protectBranch] Protecting [${safeBranch}]`);
  const encodedBranch = encodeURIComponent(safeBranch);
  const res = await ghFetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}/branches/${encodedBranch}/protection`, token, {
    method: 'PUT',
    body: JSON.stringify({
      required_status_checks: null,
      enforce_admins: true,
      required_pull_request_reviews: null,
      restrictions: null,
      allow_force_pushes: false,
      allow_deletions: false
    })
  });
  return res.json();
};
