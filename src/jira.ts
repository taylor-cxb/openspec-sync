import * as fs from 'fs';
import * as path from 'path';
import { JiraConfig } from './config';

interface JiraAttachment {
  id: string;
  filename: string;
  created: string;
  size: number;
  content: string; // URL to download
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    attachment?: JiraAttachment[];
  };
}

export class JiraClient {
  private config: JiraConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `https://${config.host}/rest/api/3`;
    this.authHeader = `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`JIRA API error (${response.status}): ${text}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return {} as T;
  }

  /**
   * Get issue details including attachments
   */
  async getIssue(ticketId: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(`/issue/${ticketId}?fields=summary,attachment`);
  }

  /**
   * Check if a ticket exists and is accessible
   */
  async ticketExists(ticketId: string): Promise<boolean> {
    try {
      await this.getIssue(ticketId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find openspec.zip attachment on a ticket
   */
  async findOpenspecAttachment(ticketId: string): Promise<JiraAttachment | null> {
    const issue = await this.getIssue(ticketId);
    const attachments = issue.fields.attachment || [];

    // Find all openspec.zip attachments, sorted by creation date (newest first)
    const openspecAttachments = attachments
      .filter(a => a.filename === 'openspec.zip')
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return openspecAttachments[0] || null;
  }

  /**
   * Download an attachment to a local file
   */
  async downloadAttachment(attachment: JiraAttachment, destPath: string): Promise<void> {
    const response = await fetch(attachment.content, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
  }

  /**
   * Upload a file as an attachment to a ticket
   * If openspec.zip already exists, delete it first
   */
  async uploadAttachment(ticketId: string, filePath: string, filename: string): Promise<void> {
    // First, find and delete existing openspec.zip if it exists
    const existing = await this.findOpenspecAttachment(ticketId);
    if (existing) {
      await this.deleteAttachment(existing.id);
    }

    // Upload the new file
    const fileContent = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append('file', new Blob([fileContent]), filename);

    const response = await fetch(`${this.baseUrl}/issue/${ticketId}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'X-Atlassian-Token': 'no-check',
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to upload attachment: ${response.status} - ${text}`);
    }
  }

  /**
   * Delete an attachment by ID
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.request(`/attachment/${attachmentId}`, {
      method: 'DELETE',
    });
  }
}
