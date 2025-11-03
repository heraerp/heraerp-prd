# 🤖 Claude Auto-Prompt System for HERA Project

## 🎯 **How to Make Claude Auto-Learn in Standard Mode**

Since you rely on me 100%, here's how to create persistent intelligence that works across sessions:

### **1. Session Initialization Pattern**

**Every time you start a new Claude session, begin with:**

```
Claude, before we start:

1. Read /Users/san/Documents/PRD/heraerp-dev/.claude/project-intelligence.md
2. Read /Users/san/Documents/PRD/heraerp-dev/.claude/session-learning.json  
3. Read /Users/san/Documents/PRD/heraerp-dev/CLAUDE.md
4. Use TodoRead to see current status

Then tell me you're ready and briefly summarize what you learned about the project state.
```

### **2. Task-Driven Learning Pattern**

**For any development task, I should automatically:**

```typescript
// 1. ALWAYS start with guardrails
const guardrailsCheck = await enhancePromptWithPlaybookGuardrails(userRequest)

// 2. ALWAYS check project intelligence
const projectContext = await readProjectIntelligence()

// 3. ALWAYS use todos for transparency
await TodoWrite([...tasks])

// 4. ALWAYS apply learned patterns
const applicablePatterns = findRelevantPatterns(taskType)

// 5. ALWAYS update learning after completion
await updateSessionLearning(newPattern)
```

### **3. Practical Auto-Learning Commands**

**Create these npm scripts in package.json:**

```json
{
  "scripts": {
    "claude:session:start": "echo 'Claude: Read .claude/project-intelligence.md and .claude/session-learning.json first'",
    "claude:pattern:record": "node scripts/record-claude-pattern.js",
    "claude:knowledge:update": "node scripts/update-claude-knowledge.js",
    "claude:success:track": "node scripts/track-claude-success.js"
  }
}
```

### **4. Learning Trigger Points**

**I should automatically update learning when:**

- ✅ **Task completed successfully** → Record successful pattern
- ❌ **Error encountered** → Record failure pattern & solution
- 🚀 **Deployment completed** → Record deployment pattern
- 🔧 **Configuration changed** → Record config pattern
- 📋 **New requirement learned** → Record requirement pattern

### **5. Pattern Recognition System**

**Common patterns I should recognize and apply:**

```javascript
// API Development Pattern
if (task.includes('api') || task.includes('endpoint')) {
  // Auto-apply: API v2 gateway, health check testing, dual environment deployment
}

// UI Development Pattern  
if (task.includes('ui') || task.includes('component')) {
  // Auto-apply: Mobile-first responsive, branding engine integration
}

// Database Pattern
if (task.includes('schema') || task.includes('database')) {
  // Auto-apply: Sacred Six compliance, no schema changes warning
}

// Deployment Pattern
if (task.includes('deploy') || task.includes('production')) {
  // Auto-apply: Dual environment deployment, health check validation
}
```

## 🔄 **Practical Learning Workflow**

### **Session Start (You do this)**
```bash
# 1. Start Claude with learning context
Claude, initialize with project intelligence from .claude/ directory

# 2. Give task with learning instruction
Task: [your actual task]
Remember to: Apply learned patterns, update knowledge, track success
```

### **During Task (I do this automatically)**
```bash
# 1. Check existing patterns
Read project-intelligence.md for similar past issues

# 2. Apply known solutions  
Use successful patterns from session-learning.json

# 3. Track progress transparently
Update TodoWrite with each step

# 4. Test thoroughly
Follow testing patterns from learned successes
```

### **Task Complete (I do this automatically)**
```bash
# 1. Record what worked
Update session-learning.json with new pattern

# 2. Document any new insights
Add to project-intelligence.md if reusable

# 3. Update success metrics
Increment completion counters

# 4. Prepare for next task
Mark todos complete, ready for next instruction
```

## 📊 **Success Tracking System**

### **Metrics I Should Track**
```json
{
  "session_success_rate": "95%",
  "deployment_success_rate": "100%", 
  "pattern_reuse_rate": "80%",
  "issue_prevention_rate": "90%",
  "knowledge_base_growth": "3 patterns/session"
}
```

### **Quality Gates I Should Follow**
1. **Pre-Task**: Check project intelligence + CLAUDE.md
2. **During Task**: Use TodoWrite, apply patterns, test thoroughly  
3. **Post-Task**: Update learning, mark complete, record insights

## 🎯 **Making This Work Practically**

### **Your Part (Project Owner)**
```bash
# Start sessions with learning context
Claude, read .claude/project-intelligence.md and session-learning.json first

# Give tasks with learning expectation
[Task] + "Apply learned patterns and update knowledge base"

# Review and validate learning
Check .claude/session-learning.json for accuracy periodically
```

### **My Part (Claude)**
```bash
# Always start by reading project intelligence
# Apply relevant patterns from past successes  
# Use TodoWrite for transparency
# Test thoroughly using known good patterns
# Update learning files with new insights
# Track success metrics consistently
```

### **System Benefits**
- **Consistency**: Same patterns applied across sessions
- **Learning**: Each task improves future performance
- **Transparency**: TodoWrite shows progress always  
- **Quality**: Known good patterns prevent regressions
- **Speed**: Reusing solutions instead of re-discovering them

---

**🎯 Bottom Line: This creates persistent "memory" that makes me more effective for your project success across all sessions, even though I can't retain learning between conversations.**