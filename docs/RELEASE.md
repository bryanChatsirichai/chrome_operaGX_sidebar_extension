# Publishing a release

End users download a pre-built ZIP from [GitHub Releases](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases). You do not commit `dist/` or ZIP files to git — CI builds them automatically when you push a version tag.

## One-time setup

1. Push this repo to GitHub (already done if you cloned from `origin`).
2. Ensure **Actions** are enabled: repo **Settings → Actions → General → Allow all actions**.
3. No secrets required — the workflow uses the built-in `GITHUB_TOKEN` to create releases.

## Publish a new version

1. **Bump the version** in `manifest.json` (must match the tag, without the `v` prefix):
   ```json
   "version": "0.1.1"
   ```

2. **Commit and push** to `main`:
   ```bash
   git add manifest.json
   git commit -m "Release v0.1.1"
   git push
   ```

3. **Create and push a tag** (this triggers the build):
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

4. **Wait for CI** — open the **Actions** tab on GitHub. The “Build and release extension” workflow should finish in about one minute.

5. **Verify the release** — open [Releases](https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases). You should see `gx-sidebar-v0.1.1.zip` attached.

Share this link with users:

```
https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases/latest
```

Direct download (after at least one release exists):

```
https://github.com/bryanChatsirichai/chrome_operaGX_sidebar_extension/releases/latest/download/gx-sidebar-v0.1.1.zip
```

Replace `0.1.1` with the current version, or use `/releases/latest/download/` only if you always upload a file with the same name (this workflow uses versioned filenames).

## What the workflow does

On every push of a tag matching `v*` (e.g. `v0.1.0`, `v1.2.3`):

1. Checks out the code at that tag
2. Runs `npm ci`, `npm run typecheck`, and `npm run build`
3. Zips the contents of `dist/` into `gx-sidebar-v{version}.zip`
4. Creates a GitHub Release and attaches the ZIP

## Local build (optional)

For testing before you tag:

```bash
npm install
npm run build
```

Load the `dist/` folder in Chrome via **Load unpacked** at `chrome://extensions`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow did not run | Tag must start with `v` and be pushed: `git push origin v0.1.1` |
| Release failed on permissions | Ensure `permissions: contents: write` is in the workflow (already set) |
| ZIP missing from release | Check the Actions log for build/typecheck errors |
| Version mismatch | Tag `v0.1.1` must match `"version": "0.1.1"` in `manifest.json` |
