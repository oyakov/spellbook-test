name: git-version-control
description: >
  Git version control operations, branching strategies, commit conventions, and repository management.
  Use this skill whenever the user works with Git repositories, needs to create branches, make commits,
  resolve merge conflicts, set up branching strategies, write .gitignore files, manage remotes, do
  cherry-picks, rebases, or any source control operation. Also use when the user mentions version control,
  pull requests, code review workflows, GitFlow, GitHub Flow, trunk-based development, or needs help
  with git commands — even if they don't explicitly say "git".

## When to use
- User needs to run git commands (clone, branch, commit, push, merge, rebase, cherry-pick, stash, tag)
- Setting up branching strategies (GitFlow, GitHub Flow, trunk-based)
- Writing conventional commits or enforcing commit message formats
- Resolving merge conflicts or understanding diff output
- Configuring .gitignore, .gitattributes, hooks, or aliases
- Managing remotes, submodules, or worktrees
- Integrating Git with CI/CD pipelines
- Code review and pull request workflows

## Core Concepts

### Repository Lifecycle
Every Git workflow starts with a repository. Understanding the state transitions is essential for correct operations.

**Working Directory → Staging Area → Local Repository → Remote Repository**

✅ Correct flow:
```bash
git add -p                    # Stage specific hunks, not blindly "git add ."
git commit -m "feat(auth): add JWT token refresh"  # Conventional commit
git push origin feature/auth-refresh
```

❌ Common mistake:
```bash
git add .                     # Stages everything including debug files
git commit -m "changes"       # Meaningless message
git push -f origin main       # Force-push to main
```

### Branching Strategies
Choose a strategy based on team size, release cadence, and deployment model.

**GitFlow** — for scheduled releases with multiple environments:
- `main` — production-ready code
- `develop` — integration branch for features
- `feature/*` — individual features branched from develop
- `release/*` — release preparation from develop
- `hotfix/*` — urgent fixes from main

**GitHub Flow** — for continuous deployment:
- `main` — always deployable
- `feature/*` — short-lived branches, merged via PR
- Deploy on merge to main

**Trunk-Based Development** — for high-velocity teams:
- `main` — single source of truth
- Short-lived feature branches (< 1 day)
- Feature flags for incomplete work
- Continuous integration required

### Decision Tree: Which Strategy?
```javascript
Do you release on a schedule?
├─ YES → Do you maintain multiple versions?
│        ├─ YES → GitFlow
│        └─ NO  → Release branching
└─ NO  → Do you deploy continuously?
         ├─ YES → Team > 5 people?
         │        ├─ YES → GitHub Flow
         │        └─ NO  → Trunk-Based
         └─ NO  → GitHub Flow
```

## Instructions

### Commit Messages
Use Conventional Commits format. This matters because automated tooling (changelogs, semantic versioning, CI triggers) depends on structured messages.

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat` — new feature (bumps MINOR)
- `fix` — bug fix (bumps PATCH)
- `docs` — documentation only
- `style` — formatting, no logic change
- `refactor` — code restructure, no behavior change
- `perf` — performance improvement
- `test` — adding/fixing tests
- `chore` — maintenance (deps, configs)
- `ci` — CI/CD changes

**Breaking changes:** append `!` after type or add `BREAKING CHANGE:` in footer.

✅ Good commits:
```javascript
feat(api): add user registration endpoint
fix(auth): handle expired refresh tokens gracefully
refactor(db)!: migrate from MongoDB to PostgreSQL
```

❌ Bad commits:
```javascript
fixed stuff
WIP
Merge branch 'main' into feature
```

### Branch Naming
Consistent naming helps automation and readability.

**Pattern:** `<type>/<ticket-id>-<short-description>`

✅ Examples:
```javascript
feature/AUTH-123-jwt-refresh
bugfix/PAY-456-stripe-webhook-retry
hotfix/PROD-789-null-pointer-crash
release/v2.3.0
```

### Merge vs Rebase
The choice between merge and rebase affects history readability and bisect-ability.

**Use merge when:**
- Integrating feature branches into main/develop
- You want to preserve the full branch history
- Multiple people worked on the same branch

**Use rebase when:**
- Updating a feature branch with latest changes from main
- Cleaning up local commits before a PR
- You want a linear, clean history

**Interactive rebase for cleanup:**
```bash
git rebase -i HEAD~5    # Squash/reorder last 5 commits
```
The reason rebase is preferred for local cleanup: it produces a linear history that's easier to review and bisect. But never rebase commits that have been pushed and shared — this rewrites history that others depend on.

### Conflict Resolution
1. **Understand the conflict** — read both sides before choosing
2. **Use a merge tool** — `git mergetool` with a configured diff tool
3. **Test after resolution** — always run tests before committing the merge
4. **Prefer small, frequent merges** — reduces conflict surface area

```bash
# See what's conflicting
git diff --name-only --diff-filter=U

# After resolving
git add <resolved-files>
git commit   # Uses the merge commit message
```

### Git Hooks
Automate quality checks at commit time. Catching issues early saves CI time and review cycles.

**Common hooks:**
- `pre-commit` — lint, format, check secrets
- `commit-msg` — validate conventional commit format
- `pre-push` — run tests before pushing

**Use Husky + lint-staged (Node.js projects):**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

### .gitignore Best Practices
Always start with a language/framework template from gitignore.io, then customize.

**Must ignore:**
- Build artifacts (`dist/`, `build/`, `target/`)
- Dependencies (`node_modules/`, `vendor/`, `.venv/`)
- IDE configs (`.idea/`, `.vscode/` — unless team-shared)
- Environment files (`.env`, `.env.local`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Secrets and credentials

### Undoing Mistakes
```bash
# Undo last commit but keep changes staged
git reset --soft HEAD~1

# Undo last commit and unstage changes
git reset --mixed HEAD~1

# Completely discard last commit
git reset --hard HEAD~1

# Undo a pushed commit safely (creates a new revert commit)
git revert <commit-hash>

# Recover deleted branch or lost commit
git reflog
git checkout -b recovered-branch <commit-hash>
```
The reason `revert` is preferred over `reset` for shared history: reset rewrites history, which breaks other developers' local copies. Revert creates a new commit that undoes the change, preserving the timeline.
