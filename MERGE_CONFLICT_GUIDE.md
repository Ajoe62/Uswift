# Git Merge Conflict Resolution Guide

## Overview
This document explains merge conflicts, how they occur, how to resolve them, and best practices to prevent them in the future.

---

## What Happened: Recent Merge Conflict

### Context
- **Branches Involved**: `master` and `backend-implement`
- **Conflicting File**: `.claude/settings.local.json`
- **Date**: October 11, 2025

### The Conflict

When merging `backend-implement` into `master`, Git detected conflicting changes in `.claude/settings.local.json`:

```bash
$ git merge backend-implement
Auto-merging .claude/settings.local.json
CONFLICT (content): Merge conflict in .claude/settings.local.json
Automatic merge failed; fix conflicts and then commit the result.
```

### Root Cause

**Why it happened:**
1. Both branches modified `.claude/settings.local.json` independently
2. The `master` branch had permissions: `["read_file", "list_dir", "file_search"]`
3. The `backend-implement` branch had additional permissions: `["create_file", "replace_string_in_file"]`
4. Git couldn't automatically merge because both branches changed the same section of the file

**Conflict markers in the file:**
```json
<<<<<<< HEAD
  "allowedTools": ["read_file", "list_dir", "file_search"]
=======
  "allowedTools": ["create_file", "replace_string_in_file"]
>>>>>>> backend-implement
```

- `<<<<<<< HEAD` = Current branch (master)
- `=======` = Separator
- `>>>>>>> backend-implement` = Incoming branch

---

## How We Fixed It

### Step 1: Identify the Conflict
```bash
$ git status
# Shows: both modified: .claude/settings.local.json
```

### Step 2: Resolve the Conflict
We manually edited `.claude/settings.local.json` to combine both sets of permissions:

**Before (Conflicted):**
```json
{
<<<<<<< HEAD
  "allowedTools": ["read_file", "list_dir", "file_search"]
=======
  "allowedTools": ["create_file", "replace_string_in_file"]
>>>>>>> backend-implement
}
```

**After (Resolved):**
```json
{
  "allowedTools": [
    "read_file",
    "list_dir", 
    "file_search",
    "create_file",
    "replace_string_in_file"
  ]
}
```

### Step 3: Mark as Resolved and Commit
```bash
$ git add .claude/settings.local.json
$ git commit -m "Merge backend-implement: resolve settings conflict"
```

---

## Understanding Merge Conflicts

### What is a Merge Conflict?

A merge conflict occurs when:
1. Two branches modify the **same lines** in the **same file**
2. Git cannot automatically determine which changes to keep
3. Manual intervention is required to resolve the conflict

### Types of Conflicts

#### 1. **Content Conflict** (Most Common)
- Both branches edit the same lines differently
- Example: Our `.claude/settings.local.json` conflict

#### 2. **Add/Add Conflict**
- Both branches add a new file with the same name but different content
- Git marks it as: `CONFLICT (add/add)`

#### 3. **Delete/Modify Conflict**
- One branch deletes a file while another modifies it
- Git asks: keep the modified version or delete?

#### 4. **Rename Conflict**
- Both branches rename the same file to different names

---

## How to Resolve Merge Conflicts

### Method 1: Manual Resolution (Recommended)

**Step-by-step:**

1. **Check which files have conflicts:**
   ```bash
   git status
   ```

2. **Open the conflicted file in your editor:**
   ```bash
   code .claude/settings.local.json
   ```

3. **Look for conflict markers:**
   ```
   <<<<<<< HEAD
   (your current branch's version)
   =======
   (incoming branch's version)
   >>>>>>> branch-name
   ```

4. **Decide what to keep:**
   - Keep current changes (HEAD)
   - Keep incoming changes (branch-name)
   - Combine both changes (our approach)
   - Write entirely new content

5. **Remove conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)

6. **Stage the resolved file:**
   ```bash
   git add .claude/settings.local.json
   ```

7. **Complete the merge:**
   ```bash
   git commit -m "Merge: resolve conflicts in settings.local.json"
   ```

### Method 2: Using VS Code

VS Code provides a visual interface for resolving conflicts:

1. Open the conflicted file
2. VS Code highlights conflicts with colors
3. Click on action buttons:
   - `Accept Current Change` (keep HEAD)
   - `Accept Incoming Change` (keep branch)
   - `Accept Both Changes` (combine both)
   - `Compare Changes` (side-by-side view)

### Method 3: Command Line Tools

**Accept all changes from one side:**

```bash
# Keep all current branch changes
git checkout --ours .claude/settings.local.json

# Keep all incoming branch changes
git checkout --theirs .claude/settings.local.json

# Then stage and commit
git add .claude/settings.local.json
git commit -m "Merge: resolve conflicts"
```

**Use merge tool:**
```bash
git mergetool
```

---

## How to Prevent Merge Conflicts

### 1. **Communication & Coordination**

**Best Practices:**
- Communicate with team members about what files you're working on
- Use feature branches for isolated work
- Keep branches short-lived (merge frequently)
- Review what others are working on before starting

**Example Workflow:**
```bash
# Before starting work
git fetch origin
git checkout master
git pull origin master
git checkout -b feature/my-feature
```

### 2. **Frequent Merging/Rebasing**

**Sync with main branch regularly:**

```bash
# Option A: Merge (preserves history)
git checkout feature-branch
git merge master
git push

# Option B: Rebase (cleaner history)
git checkout feature-branch
git rebase master
git push --force-with-lease
```

**Why this helps:**
- Conflicts are smaller and easier to resolve
- You catch conflicts early when context is fresh
- Reduces the "big bang" merge at the end

### 3. **Small, Focused Commits**

**Good Practice:**
```bash
git commit -m "Add AI chat feature"           # ✅ Specific
git commit -m "Update Mistral API config"     # ✅ One change
```

**Bad Practice:**
```bash
git commit -m "Various updates"               # ❌ Vague
git commit -m "WIP"                          # ❌ Unclear
```

### 4. **File Organization**

**Reduce overlap by organizing files:**

- **Modularize code**: Split large files into smaller, focused modules
- **Separate concerns**: UI, logic, config, tests in different files
- **Feature folders**: Group related files together

**Example Structure:**
```
extension/
├── src/
│   ├── features/
│   │   ├── chat/              # Chat feature
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── chatService.ts
│   │   │   └── chat.test.ts
│   │   └── resume/            # Resume feature
│   │       ├── ResumeEnhancer.tsx
│   │       ├── resumeService.ts
│   │       └── resume.test.ts
│   ├── api/                   # Shared API
│   └── config/                # Configuration
```

### 5. **Configuration Management**

**For config files like `.claude/settings.local.json`:**

- **Use separate config files per environment:**
  ```
  .claude/settings.local.json      # Local dev (gitignored)
  .claude/settings.example.json    # Template (committed)
  ```

- **Document config changes in README:**
  ```markdown
  ## Configuration Changes
  - Add new permission to `.claude/settings.local.json`
  - See `.claude/settings.example.json` for reference
  ```

- **Use environment variables for sensitive data:**
  ```bash
  # .env (gitignored)
  MISTRAL_API_KEY=your-key-here
  ```

### 6. **Git Workflow Best Practices**

**Feature Branch Workflow:**

```bash
# 1. Create feature branch from latest master
git checkout master
git pull origin master
git checkout -b feature/ai-chat

# 2. Work on feature with small commits
git add src/ChatInterface.tsx
git commit -m "Add ChatInterface component"

# 3. Keep feature branch updated
git checkout master
git pull origin master
git checkout feature/ai-chat
git merge master  # Or: git rebase master

# 4. Push and create pull request
git push origin feature/ai-chat
```

**Pull Request (PR) Process:**

1. **Before creating PR:**
   - Merge latest `master` into your branch
   - Resolve any conflicts locally
   - Test thoroughly

2. **During PR review:**
   - Address review comments in new commits
   - Keep syncing with `master` if it changes

3. **Before merging PR:**
   - Final sync with `master`
   - Squash commits if needed (optional)

### 7. **Use `.gitattributes` for Special Files**

**Prevent certain files from merging:**

```bash
# .gitattributes
*.lock merge=ours              # Always keep our version of lock files
package-lock.json merge=ours   # npm lock files
pnpm-lock.yaml merge=ours      # pnpm lock files
```

### 8. **Code Review & Testing**

**Catch conflicts early:**

- Review PRs promptly (don't let them go stale)
- Run CI/CD tests before merging
- Use branch protection rules:
  ```yaml
  # GitHub branch protection
  - Require pull request reviews
  - Require status checks to pass
  - Require branches to be up to date before merging
  ```

---

## Emergency: Abort a Merge

If you encounter too many conflicts and want to start over:

```bash
# Abort the merge and return to pre-merge state
git merge --abort

# OR if you're in the middle of a rebase
git rebase --abort
```

---

## Tools to Help Manage Conflicts

### 1. **Git Aliases**
Add to `.gitconfig`:

```ini
[alias]
    # Show conflicts
    conflicts = diff --name-only --diff-filter=U
    
    # List files with conflicts
    conflicted = !git ls-files -u | cut -f 2 | sort -u
    
    # Undo last commit (but keep changes)
    undo = reset HEAD~1 --soft
```

### 2. **VS Code Extensions**
- **GitLens**: Visual Git history and blame annotations
- **Git Graph**: Interactive Git graph visualization
- **Merge Conflict**: Enhanced conflict resolution

### 3. **External Merge Tools**
```bash
# Configure your preferred merge tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait --merge $REMOTE $LOCAL $BASE $MERGED'

# Use it during conflicts
git mergetool
```

---

## Summary: Key Takeaways

### ✅ **DO:**
- Communicate with your team about file changes
- Merge/rebase frequently to stay in sync
- Make small, focused commits
- Test before merging
- Resolve conflicts locally before pushing
- Use feature branches for new work

### ❌ **DON'T:**
- Work on the same files simultaneously without coordination
- Let feature branches go stale
- Make massive commits with unrelated changes
- Force push to shared branches
- Ignore conflicts or resolve them hastily
- Commit conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

---

## Quick Reference Commands

```bash
# Check for conflicts
git status

# See conflicted files
git diff --name-only --diff-filter=U

# Accept current branch version
git checkout --ours <file>

# Accept incoming branch version
git checkout --theirs <file>

# Mark conflict as resolved
git add <file>

# Complete the merge
git commit

# Abort merge
git merge --abort

# Continue after resolving
git merge --continue
```

---

## Related Documentation
- [Git Merge Conflicts](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)
- [LAYOUT_ROUTER_ERROR_FIX.md](./LAYOUT_ROUTER_ERROR_FIX.md) - Related fix documentation
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Last Updated**: October 11, 2025  
**Project**: Uswift - AI-Powered Job Application Platform
