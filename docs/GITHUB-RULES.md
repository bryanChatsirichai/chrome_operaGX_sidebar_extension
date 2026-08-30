# GitHub repository access rules

Configure who can push to `main`, approve PRs, and publish release tags. These settings live on GitHub — commit the files in `.github/` first, then apply the rules below.

## Summary

| Action | Who |
|--------|-----|
| Push directly to `main` | Owner only (`bryanChatsirichai`) |
| Merge via PR | Owner approval required (`.github/CODEOWNERS`) |
| Push release tags (`v*`) | Owner only (tag ruleset) |
| Download extension ZIP | Anyone (GitHub Releases) |

---

## 1. Branch protection on `main`

### Import the ruleset (recommended)

1. Commit and push `.github/rulesets/main-branch.json` to `main`
2. On GitHub: **Settings → Rules → Rulesets**
3. **New ruleset → Import a ruleset**
4. Select `.github/rulesets/main-branch.json`
5. Review settings:
   - **Target:** branch `refs/heads/main` (full ref path)
   - **Pull request:** 1 approval, code owner review (uses `.github/CODEOWNERS`)
   - **Restrict updates:** only bypass list can push directly to `main`
   - **Bypass:** `bryanChatsirichai` (and Repository Admin)
6. Set enforcement to **Active** → **Save**

### What the ruleset does

- **PR required** — changes must go through a pull request with **1 approval**
- **Code owner review** — you must approve (via `.github/CODEOWNERS`)
- **Dismiss stale reviews** — new commits reset approvals
- **Restrict updates** — only bypass users can push directly to `main`; others use PRs
- **No force push / branch delete** on `main`

### Manual setup (alternative)

**Settings → Rules → Rulesets → New branch ruleset**

| Setting | Value |
|---------|--------|
| Branch / pattern | `refs/heads/main` |
| Require a pull request before merging | On |
| Required approvals | **1** |
| Require review from Code Owners | On (uses `.github/CODEOWNERS`) |
| Restrict who can push | **Only `bryanChatsirichai`** |
| Dismiss stale approvals on new commits | Recommended |

Contributors with **Write** access can push feature branches and open PRs, but cannot push to `main` or merge without your approval.

---

## 2. Tag ruleset — owner-only releases

Release builds are triggered by pushing tags like `v0.1.0`. This ruleset blocks everyone except the owner from creating, moving, or deleting those tags.

### Import the ruleset (recommended)

1. Commit and push `.github/rulesets/release-tags.json` to `main`
2. On GitHub: **Settings → Rules → Rulesets**
3. **New ruleset → Import a ruleset**
4. Select `.github/rulesets/release-tags.json` from this repo (or download from GitHub and pick the file)
5. Review settings:
   - **Target:** tags matching `refs/tags/v*` (full ref path — bare `v*` fails import)
   - **Rules:** restrict creation, update, deletion
   - **Bypass:** `bryanChatsirichai` (and Repository Admin)
6. Set enforcement to **Active** → **Create** / **Save**

### What the ruleset does

- **`refs/tags/v*` pattern** — matches release tags like `v0.1.0` (GitHub rulesets require the full ref path, not bare `v*`)
- **Creation / update / deletion** — only users on the bypass list can push or move release tags
- **Non-fast-forward** — prevents force-updating tags
- **Bypass list** — preconfigured for `@bryanChatsirichai` in the JSON file

After this is active, only you can run:

```bash
git tag v0.1.1
git push origin v0.1.1
```

Others get a permission error if they try to push a `v*` tag.

### Manual setup (alternative)

**Settings → Rules → Rulesets → New tag ruleset**

1. Name: `Release tags (v*) — owner only`
2. Enforcement: **Active**
3. **Bypass list → Add bypass →** select your user (and optionally **Repository admin**)
4. **Target tags → Add → Include →** pattern `refs/tags/v*` (or `v*` in the UI if importing is not used)
5. **Tag protections** — enable:
   - Restrict creations
   - Restrict updates
   - Restrict deletions
   - Restrict force pushes
6. Save

---

## 3. Collaborator roles

**Settings → Collaborators**

| Person | Role |
|--------|------|
| Owner | (you) |
| Trusted contributors | **Write** |
| Do not grant | **Maintain** / **Admin** (can change rules or bypass protections) |

---

## 4. Verify

1. **Contributor cannot push to main**
   ```bash
   git push origin main   # should fail
   ```
2. **Contributor can open a PR** from a feature branch → merge blocked until you approve
3. **Contributor cannot push a release tag**
   ```bash
   git tag v9.9.9 && git push origin v9.9.9   # should fail
   ```
4. **You can still release** — see [RELEASE.md](RELEASE.md)

---

## Files in this repo

| File | Purpose |
|------|---------|
| `.github/CODEOWNERS` | Requires your review on all PRs |
| `.github/rulesets/main-branch.json` | Importable branch protection for `main` (PR + owner-only push) |
| `.github/rulesets/release-tags.json` | Importable tag protection for `v*` |
| `.github/workflows/release.yml` | Builds ZIP when a `v*` tag on `main` is pushed |

> **Note:** GitHub does not auto-apply rulesets from repo files. Import each JSON once in **Settings → Rules → Rulesets** (or create rules manually). Use full ref paths in patterns (`refs/heads/main`, `refs/tags/v*`).
