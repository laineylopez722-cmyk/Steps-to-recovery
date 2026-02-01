# 🚀 Steps to Recovery - MCP Servers & Skills Quick Reference

> **Last Updated:** 2025-12-31
> **Project:** Steps to Recovery - Privacy-First 12-Step Recovery Companion App

---

## 📦 Currently Installed MCP Servers

### ✅ Working Servers

#### 1. **Context7** (Documentation Lookup)

- **Status:** ✓ Connected
- **Package:** `@upstash/context7-mcp`
- **Purpose:** Get up-to-date documentation for React Native, Expo, TypeScript, Supabase, etc.
- **Example Usage:**
  ```
  "How do I use Expo SecureStore for encryption keys?"
  "Show me React Navigation bottom-tabs examples"
  "What's the latest Supabase Row Level Security syntax?"
  ```

#### 2. **Greptile** (AI Code Search & PR Review)

- **Status:** ✓ Connected
- **Purpose:** Intelligent code search, PR reviews, custom context
- **Key Features:**
  - Search across your entire codebase semantically
  - Get AI-powered PR reviews
  - Track custom patterns and instructions
- **Available Commands:** See functions like `list_merge_requests`, `get_code_review`, etc.

#### 3. **AgentVibes** (TTS/Voice Features)

- **Status:** ✓ Connected
- **Package:** `agentvibes`
- **Purpose:** Text-to-speech and voice features for Claude Code
- **Use Cases:** Accessibility, voice feedback during long builds

---

### ⚠️ Servers Needing Authentication/Fixing

#### 4. **Supabase MCP** ⭐ CRITICAL FOR YOUR PROJECT

- **Status:** ⚠ Needs authentication
- **URL:** `https://mcp.supabase.com/mcp`
- **Purpose:** Direct Supabase database queries, schema management, real-time subscriptions
- **Fix:**
  ```bash
  # Authenticate with Supabase
  # Run this command in Claude Code:
  /mcp
  # Then follow OAuth flow for Supabase
  ```
- **Why Critical:** Your app heavily relies on Supabase for backend, auth, and database

#### 5. **GitHub MCP**

- **Status:** ✗ Failed to connect
- **URL:** `https://api.githubcopilot.com/mcp/`
- **Purpose:** PR management, issues, repo operations
- **Fix:**
  ```bash
  # May need GitHub Copilot access or alternative GitHub MCP server
  # Alternative: Install official GitHub MCP
  claude mcp add --transport stdio github -- npx -y @modelcontextprotocol/server-github
  ```

#### 6. **Serena**

- **Status:** ✗ Failed to connect
- **Package:** `serena` (from oraios/serena)
- **Purpose:** AI assistant features
- **Note:** May not be essential for this project - can remove if not needed

---

## 🆕 Recommended MCP Servers to Install

### High Priority for Your Project

#### 1. **PostgreSQL MCP** ⭐⭐⭐

**Why:** Direct PostgreSQL queries for your Supabase database

```bash
claude mcp add --transport stdio postgres \
  --env DATABASE_URL="your-supabase-connection-string" \
  -- npx -y @modelcontextprotocol/server-postgres
```

**Benefits:**

- Query your Supabase database directly
- Inspect table schemas
- Test RLS policies
- Debug data issues

---

#### 2. **Filesystem MCP** ⭐⭐

**Why:** Advanced file operations (search, watch, bulk operations)

```bash
claude mcp add --transport stdio filesystem \
  -- npx -y @modelcontextprotocol/server-filesystem C:/Users/H/Steps-to-recovery
```

**Benefits:**

- Recursive file searches
- Watch files for changes
- Bulk file operations
- Advanced filtering

---

#### 3. **Git MCP** ⭐⭐

**Why:** Advanced Git operations beyond basic commands

```bash
claude mcp add --transport stdio git \
  -- npx -y @modelcontextprotocol/server-git
```

**Benefits:**

- Interactive rebasing
- Cherry-picking
- Branch management
- Commit history analysis

---

#### 4. **Memory MCP** ⭐

**Why:** Persistent memory across Claude sessions

```bash
claude mcp add --transport stdio memory \
  -- npx -y @modelcontextprotocol/server-memory
```

**Benefits:**

- Remember architectural decisions
- Track recurring issues
- Store project-specific context
- Maintain conversation continuity

---

#### 5. **Brave Search MCP** ⭐

**Why:** Web research for recovery resources, best practices, security patterns

```bash
claude mcp add --transport stdio brave-search \
  --env BRAVE_API_KEY="your-api-key" \
  -- npx -y @modelcontextprotocol/server-brave-search
```

**Benefits:**

- Research 12-step program best practices
- Find React Native security patterns
- Discover recovery-focused UX patterns
- Get up-to-date addiction recovery resources

---

### Optional but Useful

#### 6. **Puppeteer MCP**

**Why:** Browser automation for E2E testing

```bash
claude mcp add --transport stdio puppeteer \
  -- npx -y @modelcontextprotocol/server-puppeteer
```

#### 7. **Sequential Thinking MCP**

**Why:** Complex problem decomposition

```bash
claude mcp add --transport stdio thinking \
  -- npx -y @modelcontextprotocol/server-sequential-thinking
```

---

## 🛠️ BMAD Workflow Skills - Quick Reference

You have access to powerful development workflow skills via the BMAD module. These are **already available** - just invoke them with `/skill-name`.

### 🎯 Most Useful for Your Project

#### Feature Development Workflows

##### 1. `/bmad:bmm:workflows:create-tech-spec`

**When:** Before implementing any new feature
**Purpose:** Conversational tech spec creation - investigates code, asks questions, produces implementation-ready specs
**Example:**

```
/bmad:bmm:workflows:create-tech-spec
"I need to build the encrypted journal entry feature"
```

##### 2. `/bmad:bmm:workflows:dev-story`

**When:** Implementing a user story from your epics
**Purpose:** Execute story by implementing tasks/subtasks, writing tests, validating, updating story file
**Example:**

```
/bmad:bmm:workflows:dev-story
# Will prompt you to select from available stories
```

##### 3. `/bmad:bmm:workflows:quick-dev`

**When:** Fast feature implementation or direct coding tasks
**Purpose:** Flexible development - execute tech specs OR direct instructions with optional planning
**Example:**

```
/bmad:bmm:workflows:quick-dev
"Add mood tracking to journal entries"
```

##### 4. `/bmad:bmm:workflows:code-review`

**When:** After implementing a feature or story
**Purpose:** ADVERSARIAL senior developer review - finds 3-10 specific problems, challenges everything
**What it checks:**

- Code quality
- Test coverage
- Architecture compliance
- Security vulnerabilities
- Performance issues
  **Example:**

```
/bmad:bmm:workflows:code-review
# Will analyze recent changes and provide detailed critique
```

---

#### Planning & Architecture Workflows

##### 5. `/bmad:bmm:workflows:create-architecture`

**When:** Making significant architectural decisions
**Purpose:** Collaborative architectural decision facilitation for AI-agent consistency
**Example:**

```
/bmad:bmm:workflows:create-architecture
"How should we structure the encryption layer for journal entries?"
```

##### 6. `/bmad:bmm:workflows:create-prd`

**When:** Planning a new major feature
**Purpose:** Creates comprehensive PRD through collaborative discovery
**Example:**

```
/bmad:bmm:workflows:create-prd
"Sponsor connection feature"
```

##### 7. `/bmad:bmm:workflows:create-epics-and-stories`

**When:** After PRD + Architecture are complete
**Purpose:** Transform requirements into implementation-ready epics and user stories
**Example:**

```
/bmad:bmm:workflows:create-epics-and-stories
# Requires completed PRD + Architecture documents
```

##### 8. `/bmad:bmm:workflows:create-ux-design`

**When:** Planning UI/UX for a new feature
**Purpose:** Work with peer UX expert to plan UX patterns, look and feel
**Example:**

```
/bmad:bmm:workflows:create-ux-design
"Journal entry interface with mood tracking"
```

##### 9. `/bmad:bmm:workflows:check-implementation-readiness`

**When:** Before starting implementation phase
**Purpose:** Validates PRD, Architecture, Epics & Stories for completeness - uses adversarial review
**Example:**

```
/bmad:bmm:workflows:check-implementation-readiness
# Analyzes your planning docs for gaps and issues
```

---

#### Documentation Workflows

##### 10. `/bmad:bmm:workflows:document-project`

**When:** Starting work on existing codebase or after major changes
**Purpose:** Analyzes and documents brownfield projects - scans codebase, architecture, patterns
**Example:**

```
/bmad:bmm:workflows:document-project
# Creates comprehensive reference documentation
```

##### 11. `/bmad:bmm:workflows:generate-project-context`

**When:** Setting up AI context for development
**Purpose:** Creates concise `project-context.md` with critical rules and patterns for AI agents
**Example:**

```
/bmad:bmm:workflows:generate-project-context
# Optimized for LLM context efficiency
```

---

#### Sprint & Project Management

##### 12. `/bmad:bmm:workflows:sprint-planning`

**When:** Planning or tracking sprint progress
**Purpose:** Generate and manage sprint status tracking file
**Example:**

```
/bmad:bmm:workflows:sprint-planning
# Extracts epics/stories and tracks development lifecycle
```

##### 13. `/bmad:bmm:workflows:retrospective`

**When:** After epic completion
**Purpose:** Review success, extract lessons learned, check for new insights
**Example:**

```
/bmad:bmm:workflows:retrospective
# Analyzes what worked, what didn't
```

##### 14. `/bmad:bmm:workflows:correct-course`

**When:** Significant changes needed during sprint
**Purpose:** Navigate changes by analyzing impact, proposing solutions, routing for implementation
**Example:**

```
/bmad:bmm:workflows:correct-course
"We need to switch from local SQLite to Supabase only"
```

---

#### Research Workflows

##### 15. `/bmad:bmm:workflows:research`

**When:** Need to investigate technologies, patterns, or domain knowledge
**Purpose:** Comprehensive research across multiple domains using current web data
**Types:** Market, Technical, Domain research
**Example:**

```
/bmad:bmm:workflows:research
"Best practices for E2E encryption in React Native apps"
```

---

#### Diagram & Visualization Workflows

##### 16. `/bmad:bmm:workflows:create-excalidraw-diagram`

**Purpose:** System architecture diagrams, ERDs, UML diagrams
**Example:**

```
/bmad:bmm:workflows:create-excalidraw-diagram
"Create an ERD for our Supabase schema"
```

##### 17. `/bmad:bmm:workflows:create-excalidraw-dataflow`

**Purpose:** Data flow diagrams (DFD)
**Example:**

```
/bmad:bmm:workflows:create-excalidraw-dataflow
"Show how encrypted journal data flows from app to Supabase"
```

##### 18. `/bmad:bmm:workflows:create-excalidraw-flowchart`

**Purpose:** Process, pipeline, or logic flow visualizations
**Example:**

```
/bmad:bmm:workflows:create-excalidraw-flowchart
"User onboarding flow"
```

##### 19. `/bmad:bmm:workflows:create-excalidraw-wireframe`

**Purpose:** Website or app wireframes
**Example:**

```
/bmad:bmm:workflows:create-excalidraw-wireframe
"Journal entry screen wireframe"
```

---

#### Story Creation

##### 20. `/bmad:bmm:workflows:create-story`

**When:** Need to create the next user story
**Purpose:** Create next story from epics+stories with enhanced context analysis
**Example:**

```
/bmad:bmm:workflows:create-story
# Analyzes epics and creates next ready-for-dev story
```

---

## 🎯 Recommended Workflow for Your Project

### Phase 2: Journaling & Step Work (Current Focus)

```bash
# 1. Create architecture decisions (if not already done)
/bmad:bmm:workflows:create-architecture

# 2. Plan the feature via PRD (if complex)
/bmad:bmm:workflows:create-prd

# 3. Create tech spec for implementation
/bmad:bmm:workflows:create-tech-spec

# 4. Implement the feature
/bmad:bmm:workflows:quick-dev
# OR
/bmad:bmm:workflows:dev-story

# 5. Review the code
/bmad:bmm:workflows:code-review

# 6. Document as you go
/bmad:bmm:workflows:generate-project-context
```

---

## 📋 Quick Commands Cheat Sheet

### MCP Server Management

```bash
# List all MCP servers and status
claude mcp list

# Add a new server (stdio)
claude mcp add --transport stdio <name> -- <command>

# Add a new server (HTTP)
claude mcp add --transport http <name> <url>

# Remove a server
claude mcp remove <name>

# Check authentication status
/mcp

# Get server details
claude mcp get <name>
```

### In-Session Commands

```bash
# Authenticate with MCP servers
/mcp

# Run a skill
/bmad:bmm:workflows:<skill-name>

# Get help
/help
```

---

## 🔐 Security Best Practices for MCP Servers

### Environment Variables

Store sensitive data in environment variables, not in config files:

```bash
# .env file (add to .gitignore!)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
DATABASE_URL=postgresql://...
BRAVE_API_KEY=BSA...
```

### Scope Management

- **Project scope** (`.mcp.json`): Team-shared, non-sensitive servers
- **User scope** (`~/.claude.json`): Personal servers with credentials
- **Local scope**: Project-specific, local-only servers

---

## 📚 Additional Resources

- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp.md)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [BMAD Workflow Documentation](https://github.com/yourusername/bmad) <!-- Update with actual link -->
- [Supabase MCP Server](https://mcp.supabase.com/)
- [Context7 Documentation](https://upstash.com/context7)

---

## 🚀 Next Steps

1. **Authenticate Supabase MCP** (CRITICAL)

   ```bash
   # In Claude Code session
   /mcp
   # Select Supabase and complete OAuth
   ```

2. **Install PostgreSQL MCP** for direct database access

   ```bash
   claude mcp add --transport stdio postgres \
     --env DATABASE_URL="your-connection-string" \
     -- npx -y @modelcontextprotocol/server-postgres
   ```

3. **Install Filesystem MCP** for advanced file operations

   ```bash
   claude mcp add --transport stdio filesystem \
     -- npx -y @modelcontextprotocol/server-filesystem C:/Users/H/Steps-to-recovery
   ```

4. **Try your first workflow skill**

   ```bash
   /bmad:bmm:workflows:document-project
   # Generate comprehensive project documentation
   ```

5. **Generate project context for AI**
   ```bash
   /bmad:bmm:workflows:generate-project-context
   # Creates AI-optimized project context file
   ```

---

**Happy Building! 🎉**

_Remember: This is a recovery companion app. Security and privacy are paramount. Always encrypt sensitive data, validate all inputs, and follow OWASP best practices._
