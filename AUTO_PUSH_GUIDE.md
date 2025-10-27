# Auto Git Push — Deprecated

This feature has been removed from the repository by request. The script `scripts/auto-push.sh` is now a stub that exits immediately and does nothing.

## Current Status

- VS Code task "Auto Push to GitHub" has been removed from `.vscode/tasks.json`.
- `scripts/auto-push.sh` prints a deprecation message and exits.

## Recommended Workflow

Use standard Git commands to commit and push intentionally:

```bash
git add -A
git commit -m "feat: <message>"
git push origin main
```

You can also create a conventional commit task or use an extension if you want shortcuts without automatic pushing.
