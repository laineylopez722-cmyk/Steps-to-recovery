---
name: dangerous-rm-command
enabled: true
event: bash
pattern: rm\s+-rf|rm\s+-f.*\/|deltree|rmdir.*\/
action: warn
---

⚠️ **Dangerous Command: rm -rf**

You're executing a destructive delete command. Verify this is intentional!

**Common issues:**

- Accidental recursive deletion of project files
- Force deletion bypassing safety checks
- Deleting dependencies or build artifacts needed later

**Before proceeding, ask:**

- Is the target path correct?
- Should you delete specific files instead?
- Is the rm -rf necessary or could you use a safer approach?

**Safer alternatives:**

```bash
# Instead of: rm -rf node_modules
# Use: npm ci (clean install)

# Instead of: rm -rf dist
# Use: Clean build scripts

# Instead of: rm -rf .
# Use: Move to backup first
```

If this is intentional, proceed - but verify the path!
