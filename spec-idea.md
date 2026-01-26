# openspec-sync

Sync OpenSpec files to and from JIRA tickets. Never lose spec work when switching branches.

## The Problem

You're mid-spec on `feat/NFOR-225-field-metrics`, need to context switch, but:

- Don't want to commit half-finished specs to git
- Can't leave them uncommitted (they'll conflict or get lost)
- Copying to Google Drive / Slack is chaos

## The Solution

```bash
# Save specs to JIRA before switching
npm run spec:push

# Restore specs when you come back (or on another machine)
npm run spec:pull
```

Specs are stored as a zip attachment on the JIRA ticket itself—right where the work lives.

## Folder Structure

OpenSpec files are organized by ticket ID:

```
openspec/
├── AGENTS.md
└── changes/
    ├── NFOR-225/          # ← ticket ID from branch
    │   ├── design.md
    │   ├── proposal.md
    │   ├── specs/
    │   │   └── field-metrics/
    │   │       └── spec.md
    │   └── tasks.md
    └── NFOR-300/          # multiple specs can coexist
        └── ...
```

## Usage

### Push specs to JIRA

```bash
# Auto-detects ticket from current branch (feat/NFOR-225-*)
npm run spec:push

# Explicit ticket ID
npm run spec:push NFOR-300
```

**What it does:**

1. Parses ticket ID from current git branch
2. Zips `openspec/changes/{TICKET_ID}/`
3. Uploads to JIRA ticket as `openspec.zip` (replaces if exists)

### Pull specs from JIRA

```bash
# Auto-detects ticket from current branch
npm run spec:pull

# Explicit ticket ID
npm run spec:pull NFOR-300
```

**What it does:**

1. Parses ticket ID from current git branch
2. Downloads `openspec.zip` from JIRA ticket
3. Extracts to `openspec/changes/{TICKET_ID}/`
4. Prompts for confirmation if folder already exists

## Safety Features

- **Branch mismatch warning**: If you're on `NFOR-225` branch but the folder is `NFOR-300`, prompts to confirm
- **Overwrite protection**: Asks before replacing existing local specs
- **Ticket validation**: Fails fast if ticket doesn't exist or you don't have access

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure JIRA credentials

Create `.env` in project root (add to `.gitignore`):

```env
JIRA_HOST=yourcompany.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-api-token
```

Get your API token: https://id.atlassian.com/manage-profile/security/api-tokens

### 3. Add npm scripts

In `package.json`:

```json
{
  "scripts": {
    "spec:push": "node scripts/openspec-sync.js push",
    "spec:pull": "node scripts/openspec-sync.js pull"
  }
}
```

## Branch Naming Convention

The tool extracts ticket IDs from branch names using this pattern:

```
feat/NFOR-225-field-metrics     → NFOR-225
bugfix/NFOR-300-fix-something   → NFOR-300
NFOR-400-quick-branch           → NFOR-400
```

Regex: `/([A-Z]+-\d+)/` (first match)

## Edge Cases

| Scenario                     | Behavior                            |
| ---------------------------- | ----------------------------------- |
| No ticket ID in branch name  | Prompts for manual entry            |
| Ticket doesn't exist in JIRA | Fails with error                    |
| No `openspec.zip` on ticket  | Fails with helpful message          |
| Multiple openspec zips       | Uses most recent, warns             |
| Local folder exists on pull  | Prompts: overwrite / merge / cancel |

## Roadmap / Ideas

- [ ] MCP server version for Claude Desktop integration
- [ ] `spec:status` - show which tickets have specs attached
- [ ] `spec:clean` - remove local specs for closed tickets
- [ ] Git hook to remind push before branch switch
- [ ] Team-wide AGENTS.md that syncs separately

## License

MIT
