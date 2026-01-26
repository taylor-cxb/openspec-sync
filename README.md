# openspec-sync

Sync OpenSpec files to and from JIRA tickets. Never lose spec work when switching branches.

## Installation

```bash
cd ~/Utils/openspec-sync
npm install
npm run build
npm link
```

## Setup

Configure your JIRA credentials (stored in `~/.config/openspec-sync/config.json`):

```bash
openspec-sync config
```

You'll need:
- **JIRA host**: e.g., `yourcompany.atlassian.net`
- **Email**: Your Atlassian account email
- **API token**: Get from https://id.atlassian.com/manage-profile/security/api-tokens

## Usage

### Push specs to JIRA

```bash
# Auto-detects ticket from current branch (feat/NFOR-225-*)
openspec-sync push

# Explicit ticket ID
openspec-sync push NFOR-300
```

**Smart folder detection:**
- If folder `NFOR-225-something/` exists, uses it
- If no matching folder, prompts to associate an unprefixed folder
- Renames folder to `NFOR-225-{folder-name}/` before pushing

### Pull specs from JIRA

```bash
# Auto-detects ticket from current branch
openspec-sync pull

# Explicit ticket ID
openspec-sync pull NFOR-300

# Overwrite existing without prompting
openspec-sync pull --force
```

### Check status

```bash
# Check if specs exist on a ticket
openspec-sync status NFOR-225
```

### Manage config

```bash
# Configure credentials
openspec-sync config

# Show config location and status
openspec-sync config --show

# Clear stored credentials
openspec-sync config --clear
```

## Branch Detection

Ticket IDs are extracted from branch names:

```
feat/NFOR-225-field-metrics     → NFOR-225
bugfix/NFOR-300-fix-something   → NFOR-300
NFOR-400-quick-branch           → NFOR-400
```

## Folder Naming Convention

Folders should be prefixed with ticket ID:

```
openspec/changes/
├── NFOR-225-add-field-metrics/
│   ├── proposal.md
│   ├── tasks.md
│   └── specs/
└── NFOR-300-update-auth/
    └── ...
```

If you create a folder without a ticket prefix (e.g., `add-field-metrics/`), the `push` command will offer to rename it with the ticket prefix.

## How It Works

- **Push**: Zips `openspec/changes/{TICKET-ID}-*/` and uploads as `openspec.zip` attachment
- **Pull**: Downloads `openspec.zip` from ticket and extracts to `openspec/changes/`
- Existing `openspec.zip` attachments are replaced on push

## License

MIT
