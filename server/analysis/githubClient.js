const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

class GitHubClient {
  constructor(token = null) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DX-Ray-Scanner'
    };
    if (this.token) {
      this.headers['Authorization'] = `token ${this.token}`;
    } else {
      console.warn('⚠ No GITHUB_TOKEN set — rate limited to 60 req/hr. Set it in server/.env');
    }
  }

  parseRepoUrl(url) {
    if (!url) throw new Error('Repository identifier is missing');

    // Normalize: remove trailing .git and trailing slashes
    const cleanUrl = url.trim().replace(/\.git$/, '').replace(/\/$/, '');

    // Pattern 1: Full GitHub URL
    const fullMatch = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (fullMatch) return { owner: fullMatch[1], repo: fullMatch[2] };

    // Pattern 2: Shorthand owner/repo
    const shortMatch = cleanUrl.match(/^([^\/]+)\/([^\/]+)$/);
    if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

    throw new Error('Invalid GitHub format. Use user/repo or the full URL.');
  }

  async getRepoInfo(owner, repo) {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, { headers: this.headers });
    return data;
  }

  async getContributors(owner, repo) {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=30`, { headers: this.headers });
    return data;
  }

  async getCommits(owner, repo, since = null, perPage = 100) {
    const params = { per_page: perPage };
    if (since) params.since = since;
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/commits`, { headers: this.headers, params });
    return data;
  }

  async getCommitDetail(owner, repo, sha) {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`, { headers: this.headers });
    return data;
  }

  async getContents(owner, repo, path = '') {
    try {
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, { headers: this.headers });
      return data;
    } catch {
      return null;
    }
  }

  async getTree(owner, repo, sha) {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`, { headers: this.headers });
    return data;
  }

  async getPullRequests(owner, repo, state = 'all', perPage = 30) {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}&sort=created&direction=desc`, { headers: this.headers });
    return data;
  }

  async getWorkflows(owner, repo) {
    try {
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/actions/workflows`, { headers: this.headers });
      return data;
    } catch {
      return { workflows: [] };
    }
  }

  async getWorkflowRuns(owner, repo, perPage = 30) {
    try {
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`, { headers: this.headers });
      return data;
    } catch {
      return { workflow_runs: [] };
    }
  }

  async getLanguages(owner, repo) {
    const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/languages`, { headers: this.headers });
    return data;
  }

  async getPackageJson(owner, repo) {
    try {
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/contents/package.json`, { headers: this.headers });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getFileContent(owner, repo, path) {
    try {
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, { headers: this.headers });
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  async getFileLastCommit(owner, repo, path) {
    try {
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/commits?path=${path}&per_page=1`, { headers: this.headers });
      return data[0] || null;
    } catch {
      return null;
    }
  }

  async getReadme(owner, repo) {
    try {
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/readme`, { headers: this.headers });
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  async getAuthenticatedUser() {
    try {
      const { data } = await axios.get(`${GITHUB_API}/user`, { headers: this.headers });
      return data;
    } catch (err) {
      console.error('getAuthenticatedUser failed:', err.message);
      return null;
    }
  }

  async getUserEvents(username) {
    try {
      const { data } = await axios.get(`${GITHUB_API}/users/${username}/events?per_page=100`, { headers: this.headers });
      return data;
    } catch (err) {
      console.error('getUserEvents failed:', err.message);
      return [];
    }
  }

  async getUserPRs(username, owner, repo) {
    try {
      // Get PRs in THIS repo authored by THIS user
      const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}/pulls?state=all&creator=${username}&per_page=50`, { headers: this.headers });
      return data;
    } catch (err) {
      console.error('getUserPRs failed:', err.message);
      return [];
    }
  }
}

module.exports = GitHubClient;
