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

**Output includes git tracking info:**
```
Pushed NFOR-307-add-form-status-modal-live-data to NFOR-307
  Commit: 58e23ea (feat/NFOR-307-form-status-modal-live-data)
```

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

The status command shows sync state and helps you stay in sync:

```bash
openspec-sync status NFOR-225
```

**Three possible states:**

1. **Up to date** - Your HEAD matches what's in JIRA
   ```
   └─ JIRA synced at: 58e23ea (feat/NFOR-307-...)
   └─ ✓ Up to date with HEAD (58e23ea)
   ```

2. **Commits ahead** - You have newer commits, nudges you to push
   ```
   └─ JIRA synced at: 58e23ea (feat/NFOR-307-...)
   └─ Your HEAD: a56296d (3 commits ahead)

   💡 You have newer commits. Run 'openspec-sync push' to update JIRA.
   ```

3. **Wrong branch** - You're on a different branch than where the spec was pushed
   ```
   └─ JIRA synced at: 58e23ea (feat/NFOR-307-...)
   └─ ⚠️  You're on 'main' but spec was pushed from 'feat/NFOR-307-...'
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

## Typical Workflow

### Friday: End of week
```bash
# Commit your code changes
git add . && git commit -m "feat: implement feature X"

# Push specs to JIRA (includes commit hash for tracking)
openspec-sync push
```

### Monday: Returning to work
```bash
# Check status - reminds you which branch to be on
openspec-sync status NFOR-307

# If you forgot to switch branches, you'll see:
# ⚠️  You're on 'main' but spec was pushed from 'feat/NFOR-307-...'

# Switch to correct branch
git checkout feat/NFOR-307-form-status-modal-live-data

# Pull latest specs (if needed)
openspec-sync pull
```

### After merging other branches
```bash
# After merging, your HEAD is ahead of what's in JIRA
openspec-sync status NFOR-307
# └─ Your HEAD: a56296d (2 commits ahead)
# 💡 You have newer commits. Run 'openspec-sync push' to update JIRA.

# Update JIRA with new commit reference
openspec-sync push
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
│   ├── SYNC.md          # Auto-generated git metadata
│   └── specs/
└── NFOR-300-update-auth/
    └── ...
```

If you create a folder without a ticket prefix (e.g., `add-field-metrics/`), the `push` command will offer to rename it with the ticket prefix.

## How It Works

- **Push**: Writes `SYNC.md` with git metadata, zips folder, uploads as `openspec.zip` attachment
- **Pull**: Downloads `openspec.zip`, extracts to `openspec/changes/`, warns if commit not in current branch
- Existing `openspec.zip` attachments are replaced on push

## Git Hash Tracking & Branch Nudging

The core feature of openspec-sync is tracking **which git commit** your specs were written against. This prevents the common problem of having specs that don't match your code.

### How It Works

1. **On push**: The tool records your current commit hash and branch name in `SYNC.md`
2. **On pull/status**: The tool checks if that commit exists in your current branch
3. **If mismatched**: You get clear instructions to get back to the right code state

### Why This Matters

Specs and code should stay in sync. If you pull specs from JIRA but you're on `main` instead of the feature branch, your code won't match the specs. The tool detects this and tells you exactly how to fix it.

### The Nudging Flow

**Scenario 1: You pull specs but you're on the wrong branch**

```
$ openspec-sync pull NFOR-307

Pulled NFOR-307 specs to openspec/changes/

  Synced from: feat/NFOR-307-form-status @ a1b2c3d

⚠️  Code changes exist on commit a1b2c3d
   Branch: feat/NFOR-307-form-status

   To get the code changes:
     git cherry-pick a1b2c3d
     # or
     git merge feat/NFOR-307-form-status
```

The tool tells you: "These specs were written at commit `a1b2c3d` on branch `feat/NFOR-307-form-status`. Your current branch doesn't have that commit. Here's how to get the code."

**Scenario 2: You check status and you're on a different branch**

```
$ openspec-sync status NFOR-307

NFOR-307: Add form status modal
openspec.zip: attached
  Size: 12.3 KB

Local folders: NFOR-307-form-status-modal
  └─ JIRA synced at: 58e23ea (feat/NFOR-307-form-status)
  └─ ⚠️  You're on 'main' but spec was pushed from 'feat/NFOR-307-form-status'
```

The tool tells you: "Switch to the right branch before working on this."

**Scenario 3: You check status and you have newer commits**

```
$ openspec-sync status NFOR-307

Local folders: NFOR-307-form-status-modal
  └─ JIRA synced at: 58e23ea (feat/NFOR-307-form-status)
  └─ Your HEAD: a56296d (3 commits ahead)

💡 You have newer commits. Run 'openspec-sync push' to update JIRA.
```

The tool tells you: "Your code has advanced since you last pushed specs. Consider pushing to update JIRA."

**Scenario 4: Everything is in sync**

```
$ openspec-sync status NFOR-307

Local folders: NFOR-307-form-status-modal
  └─ JIRA synced at: 58e23ea (feat/NFOR-307-form-status)
  └─ ✓ Up to date with HEAD (58e23ea)
```

## SYNC.md - The Metadata File

On push, a `SYNC.md` file is automatically created in the spec folder:

```markdown
# OpenSpec Sync Metadata

| Field | Value |
|-------|-------|
| Pushed | 2026-01-26T23:01:22.938Z |
| Commit | 58e23ea |
| Branch | feat/NFOR-307-form-status-modal-live-data |
| Uncommitted Changes | No |

## To get the code changes

If your current branch doesn't contain commit `58e23ea`:

    # Option 1: Cherry-pick the commit
    git cherry-pick 58e23ea

    # Option 2: Merge the branch
    git merge feat/NFOR-307-form-status-modal-live-data

    # Option 3: Check out the branch
    git checkout feat/NFOR-307-form-status-modal-live-data
```

This file:
- Is **included in the zip** uploaded to JIRA
- Gets **pulled down** when someone else pulls the specs
- Provides **self-contained recovery instructions** - even if you're offline, the file tells you how to get the right code

## Graceful Degradation

The sync tracking is informational, not blocking:
- If JIRA is down, you still have your local specs
- If git history is weird, just push again to update the commit hash
- SYNC.md can be manually deleted if needed - push will recreate it

## License

MIT
