# Publishing a release

Users install from a ZIP attached to a [GitHub Release](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases). CI builds that ZIP when a `v*` tag is pushed. `dist/` and ZIPs are never committed.

## What CI does

[`.github/workflows/release.yml`](../.github/workflows/release.yml) runs on every pushed tag matching `v*`:

1. Checks out the tagged commit and **fails unless that commit is on `origin/main`**.
2. Runs `npm ci`, `npm run typecheck`, `npm run build` on Node 20.
3. Reads `version` from **`manifest.json`** and zips the contents of `dist/` (so `manifest.json` is at the ZIP root) as `browser-sidebar-v<version>.zip`.
4. Creates or updates the GitHub Release for the tag, attaches the ZIP (`overwrite_files: true`), and generates release notes.

There are no tests in the pipeline beyond the typecheck. Run the manual checklist in [IMPLEMENTATION.md § Debugging and testing](IMPLEMENTATION.md#12-debugging-and-testing) first.

**The workflow does not check that the tag matches the manifest version.** A mismatch doesn't fail: you get release `v0.2.5` carrying `browser-sidebar-v0.2.4.zip`. Keeping them in step is on you. `package.json`'s `version` is not used by anything.

## One-time setup

- **Actions** enabled: **Settings → Actions → General → Allow all actions**. No secrets are needed; the workflow uses `GITHUB_TOKEN` with `contents: write`.
- Import the tag ruleset so only the owner can push `v*` tags. See [GITHUB-RULES.md](GITHUB-RULES.md).

## Publish a new version

1. On a branch, bump `"version"` in `manifest.json` (e.g. `0.2.5`), merge to `main` via PR.
2. Tag the merged commit on `main` and push the tag:
   ```bash
   git checkout main && git pull
   git tag v0.2.5
   git push origin v0.2.5
   ```
3. Watch the **Build and release extension** run in the **Actions** tab (about a minute).
4. Check [Releases](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases) for `browser-sidebar-v0.2.5.zip`.

Link users to `https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases/latest`. ZIP filenames are versioned, so there is no stable `/latest/download/<file>` URL.

## Rebuilding an existing version

Pushing to `main` does **not** rebuild anything, and **Re-run** in the Actions tab rebuilds the **old** tagged commit. To ship new commits, prefer a patch bump (`0.2.5` → `0.2.6`): no tag rewriting, and users can tell builds apart.

If you must keep the same version, move the tag (owner only; the tag ruleset blocks this for everyone else):

```bash
git tag -d v0.2.5
git push origin :refs/tags/v0.2.5
git tag v0.2.5          # on the new commit on main
git push origin v0.2.5
```

The ZIP on the existing release is replaced. Anyone who already downloaded it has a different build under the same version number.

## Troubleshooting

| Problem | Cause / fix |
|---------|-------------|
| Workflow didn't run | The tag must start with `v` and be pushed (`git push origin <tag>`); pushing commits alone doesn't trigger it |
| "Release tags must point to a commit on main" | Merge to `main` first, then tag the merged commit |
| ZIP missing from the release | Typecheck or build failed; read the Actions log |
| ZIP has the wrong version in its name | `manifest.json` wasn't bumped before tagging. Bump it and re-tag (see above) |
| Tag push rejected | The tag ruleset allows only the owner to create/move/delete `v*` tags |
