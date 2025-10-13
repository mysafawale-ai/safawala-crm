#!/bin/bash

# Auto Git Push Script
# This script watches for file changes and automatically commits & pushes to GitHub

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
    sleep 30
done
