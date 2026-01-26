import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface JiraConfig {
  host: string;
  email: string;
  apiToken: string;
}

export interface Config {
  jira?: JiraConfig;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'openspec-sync');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Return empty config if file doesn't exist or is invalid
  }
  return {};
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getJiraConfig(): JiraConfig | null {
  const config = loadConfig();
  if (config.jira?.host && config.jira?.email && config.jira?.apiToken) {
    return config.jira;
  }
  return null;
}

export function setJiraConfig(jiraConfig: JiraConfig): void {
  const config = loadConfig();
  config.jira = jiraConfig;
  saveConfig(config);
}

export function clearJiraConfig(): void {
  const config = loadConfig();
  delete config.jira;
  saveConfig(config);
}
