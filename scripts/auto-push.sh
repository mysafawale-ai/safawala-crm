#!/bin/bash

# Auto Git Push Script
# This script watches for file changes and automatically commits & pushes to GitHub

# SAFETY GUARD: Disabled by default unless SINGLE_RUN is set.
if [[ "${SINGLE_RUN}" != "1" ]]; then
    if [[ -z "${ENABLE_AUTO_PUSH}" || "${ENABLE_AUTO_PUSH}" != "1" ]]; then
        echo "⛔ Auto Push is disabled. Set ENABLE_AUTO_PUSH=1 to enable it for this session."
        echo "   Example: ENABLE_AUTO_PUSH=1 ./scripts/auto-push.sh"
        echo "   Or run a one-off push with: SINGLE_RUN=1 ./scripts/auto-push.sh"
        exit 0
    fi
fi

echo "🚀 Auto Git Push - Starting..."
echo "📁 Watching directory: $(pwd)"
echo "🔄 Will auto-commit and push changes every 30 seconds"
echo "Press Ctrl+C to stop"
echo ""

# Function to commit and push changes
auto_commit_push() {
    # Check if there are any changes
    if [[ -n $(git status -s) ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📝 Changes detected at $(date '+%H:%M:%S')"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Show what changed
        git status -s
        
        # Add all changes
        git add .
        
        # Create commit with timestamp
        COMMIT_MSG="auto: Save changes at $(date '+%Y-%m-%d %H:%M:%S')"
        git commit -m "$COMMIT_MSG"
        
        # Push to GitHub
        echo ""
        echo "⬆️  Pushing to GitHub..."
        if git push origin main; then
            echo "✅ Successfully pushed to GitHub!"
        else
            echo "❌ Failed to push. Check your internet connection or credentials."
        fi
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo "⏳ No changes detected at $(date '+%H:%M:%S')"
    fi
}

# Main loop - check every 30 seconds
while true; do
    auto_commit_push
    # If running as a one-off, exit after a single attempt
    if [[ "${SINGLE_RUN}" == "1" ]]; then
        exit 0
    fi
    sleep 30
done
