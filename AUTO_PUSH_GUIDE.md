# Auto Git Push Setup

## 🚀 Automatic GitHub Push

This script automatically commits and pushes your changes to GitHub every 30 seconds.

## How to Use

### Option 1: Run in Terminal
```bash
cd /Applications/safawala-crm
./scripts/auto-push.sh
```

### Option 2: Run in Background
```bash
cd /Applications/safawala-crm
nohup ./scripts/auto-push.sh > auto-push.log 2>&1 &
```

### Option 3: Use VS Code Task
Press `Cmd+Shift+P` → Type "Run Task" → Select "Auto Push to GitHub"

## Features

✅ Monitors file changes every 30 seconds
✅ Auto-commits with timestamp
✅ Auto-pushes to GitHub main branch
✅ Shows status of each operation
✅ Handles errors gracefully

## Stop Auto-Push

If running in terminal: Press `Ctrl+C`

If running in background:
```bash
# Find the process
ps aux | grep auto-push.sh

# Kill it
kill <process_id>
```

## What Gets Committed

- All modified files
- All new files
- Commit message format: `auto: Save changes at YYYY-MM-DD HH:MM:SS`

## Notes

⚠️ Make sure you have:
- Git credentials configured
- Push access to the repository
- Internet connection for pushing

💡 Tip: Use this during active development, but stop it when done to avoid too many commits.
