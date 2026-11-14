# GitHub repository access rules

Who can push, merge, and tag. The rules live in `.github/rulesets/*.json`, but **GitHub does not apply ruleset files automatically**: import each one under **Settings → Rules → Rulesets → New ruleset → Import a ruleset**, review it, and set enforcement to **Active**. Patterns must use full ref paths (`refs/heads/main`, `refs/tags/v*`); bare `v*` fails import.

## Effective policy (all three rulesets active)

| Action | Who |
|--------|-----|
| Create, push to, or delete **any** branch | Owner only |
| Merge into `main` | Owner only (requires 1 code-owner approval, which the owner bypasses) |
| Create, move, or delete `v*` release tags | Owner only (tags trigger releases, see [RELEASE.md](RELEASE.md)) |
| Contribute | Fork and open a PR; the owner merges |
| Download the extension ZIP | Anyone (GitHub Releases) |

The bypass list in every ruleset is the owner's user ID (`89973472`). `release-tags.json` also lets the Repository Admin role bypass.

In practice this is a **single-maintainer setup**. Collaborators with Write access can't push branches (`all-branches.json`) and can't merge approved PRs (the `update` rule in `main-branch.json`). To open the repo to collaborators, drop `all-branches.json` and remove the `update` rule from `main-branch.json`. The PR + code-owner rule alone then gates `main`.

## The rulesets

### `main-branch.json`: `refs/heads/main`

| Rule | Effect |
|------|--------|
| `pull_request` | 1 approval, code-owner review (`.github/CODEOWNERS` = `@bryanChatsirichai` for `*`), stale approvals dismissed on push; merge, squash and rebase allowed |
| `update` | Only bypass actors can update `main`, which includes merging a PR |
| `non_fast_forward` | No force pushes |
| `deletion` | `main` can't be deleted |

### `all-branches.json`: every branch (`~ALL`)

`creation`, `update` and `deletion` restricted to the owner. This overlaps with `main-branch.json` for `main`.

### `release-tags.json`: `refs/tags/v*`

`creation`, `update`, `deletion` and `non_fast_forward` restricted to the owner (and Repository Admin). Moving a tag to rebuild a version needs this bypass.

## Verify

From a non-owner account with Write access:

```bash
git push origin some-branch          # rejected (all-branches)
git push origin main                 # rejected
git tag v9.9.9 && git push origin v9.9.9   # rejected
```

## Related files

| File | Purpose |
|------|---------|
| `.github/CODEOWNERS` | Owner is code owner for every path |
| `.github/rulesets/*.json` | The three rulesets above |
| `.github/workflows/release.yml` | Builds the release ZIP for `v*` tags on `main` |
| `.github/workflows/pr-review.yml` | LLM PR review via `bryanChatsirichai/github_agentic_pr_reviewer` (reusable workflow pinned to `@main`). Skips fork PRs. Needs the `MODEL_PROVIDER` Actions variable and the matching API-key secret |

## Collaborator roles

Grant **Write** at most. **Maintain** / **Admin** can edit or bypass rulesets.
