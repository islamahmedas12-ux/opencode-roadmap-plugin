---
description: Generate AI-powered improvement ideas across 6 dimensions (code, UI/UX, docs, security, performance, code quality), and PRINT each idea in detail in the chat.
agent: build
---

# /ideation — Generate Project Improvement Ideas

You are the orchestrator for a 6-type ideation pipeline. **CRITICAL CHAT-OUTPUT RULE**: after each ideation type completes, you MUST print every idea generated to the chat in detail (not just "done"). The user wants the content in the conversation context for follow-up questions, not just files on disk.

## Configuration

Project directory: `!`pwd``
Output directory: `!`pwd`/.auto-build/ideation`
Default max ideas per type: 5

## Argument parsing

`$ARGUMENTS` may contain:
- `nothing` → run all 6 types
- A space-separated list of type names → run only those
- `--max=N` → override max ideas per type

Valid type names:
- `code_improvements`
- `code_quality`
- `documentation`
- `performance`
- `security`
- `ui_ux`

Subagent mapping:
- `code_improvements` → `@ideation-code-improvements`
- `code_quality` → `@ideation-code-quality`
- `documentation` → `@ideation-documentation`
- `performance` → `@ideation-performance`
- `security` → `@ideation-security`
- `ui_ux` → `@ideation-ui-ux`

Output filename mapping:
- `code_improvements` → `code_improvements_ideas.json`
- `code_quality` → `code_quality_ideas.json`
- `documentation` → `documentation_gaps_ideas.json`
- `performance` → `performance_optimizations_ideas.json`
- `security` → `security_hardening_ideas.json`
- `ui_ux` → `ui_ux_improvements_ideas.json`

## Workflow

### Step 1: Setup

```bash
mkdir -p .auto-build/ideation
```

Determine the list of types to run from `$ARGUMENTS`. If empty or no valid types, run all 6.
Determine `<max_ideas>` from `$ARGUMENTS` (look for `--max=N`); default 5.

State which types you'll run and the max-ideas value:
```
Running ideation for: <list of types>  ·  Max ideas per type: <max_ideas>
```

### Step 2: Run each ideation type SEQUENTIALLY

For each enabled type, invoke the matching subagent via the **Task tool** with this context:

```
Project Directory: <project_dir>
Output Directory: <output_dir>
Output File: <output_dir>/<output_filename_for_type>
Max Ideas: <max_ideas>

Analyze the project and generate up to <max_ideas> high-quality, specific, actionable ideas of type "<type_name>".

Use Read, Glob, Grep, Bash to explore the codebase. Read project_index.json (if it exists), README, package.json/equivalent, and key source files.

DEPTH REQUIREMENTS:
- Each idea must be SPECIFIC and ACTIONABLE — generic ideas like "improve testing" will be rejected
- Each idea must reference specific files, functions, or patterns observed in the code
- Each idea's `rationale` must explain why the code reveals this opportunity
- Each idea's `affected_files` must list real file paths from the project
- Use the schema and effort levels in your system prompt

Use the Write tool to create the Output File as a JSON array of idea objects.
```

**Verify after each type:**
```bash
test -f <output_dir>/<filename> && echo "✓ <type> complete" || echo "✗ <type> FAILED"
```

If a type fails, log it but CONTINUE with the next type.

**REQUIRED CHAT OUTPUT — After each type completes (success or fail):**

Read the type's output file and print every idea in detail to the chat:

```markdown
## 💡 <Type Name> — <count> ideas

[For each idea:]

### <idea.id>: <idea.title>  ·  effort=<estimated_effort>

**Description**: <description>

**Rationale**: <rationale>

**Builds upon**: <builds_upon array>

**Affected files**: <affected_files array>

**Existing patterns to follow**: <existing_patterns>

**Implementation approach**: <implementation_approach>

---
```

Print every field for every idea. The user wants the content in chat context, not just the file.

If the type FAILED, print:
```markdown
## ⚠️ <Type Name> — FAILED
The subagent did not produce <filename>. Continuing with the next type.
```

### Step 3: Combined ideas.json

After all types complete, create the combined file:

```bash
python3 - <<EOF
import json, os, glob, datetime
combined = {
    "id": f"ideation-{datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}",
    "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
    "types": {},
    "all_ideas": [],
}
for f in sorted(glob.glob(".auto-build/ideation/*_ideas.json")):
    type_name = os.path.basename(f).replace("_ideas.json", "")
    if type_name == "ideas":
        continue
    try:
        with open(f) as fp:
            data = json.load(fp)
        ideas = data if isinstance(data, list) else data.get("ideas", [])
        combined["types"][type_name] = len(ideas)
        for idea in ideas:
            idea_copy = dict(idea)
            idea_copy["_source_type"] = type_name
            combined["all_ideas"].append(idea_copy)
    except Exception:
        pass
with open(".auto-build/ideation/ideas.json", "w") as fp:
    json.dump(combined, fp, indent=2)
print(f"Combined: .auto-build/ideation/ideas.json — {sum(combined['types'].values())} total ideas")
EOF
```

### Step 4: Final summary in chat

Print one final markdown summary:

```markdown
## 📊 Ideation pipeline complete

### Per-type breakdown
- **Code improvements**: <count> ideas
- **Code quality**: <count> ideas
- **Documentation**: <count> ideas
- **Performance**: <count> ideas
- **Security**: <count> ideas
- **UI/UX**: <count> ideas

**Total**: <sum> ideas

### Top 10 by effort/impact

[Sort all ideas by estimated_effort (trivial first) and present 10 candidates as quick wins:]

| # | Type | Title | Effort |
|---|------|-------|--------|
| 1 | <type> | <title> | <effort> |
| ... |

### Files written
- `.auto-build/ideation/code_improvements_ideas.json`
- `.auto-build/ideation/code_quality_ideas.json`
- `.auto-build/ideation/documentation_gaps_ideas.json`
- `.auto-build/ideation/performance_optimizations_ideas.json`
- `.auto-build/ideation/security_hardening_ideas.json`
- `.auto-build/ideation/ui_ux_improvements_ideas.json`
- `.auto-build/ideation/ideas.json` (combined)
```

## Critical rules

1. **PRINT EVERY IDEA IN FULL TO THE CHAT** — every field, no abbreviation. The user needs the content in conversation context for follow-up questions.
2. Run types **SEQUENTIALLY** — opencode handles one Task() at a time.
3. **Don't abort on individual failures** — log and continue.
4. Use the Task tool to invoke subagents.
5. After printing each type's ideas, briefly state "<Type> complete — proceeding to <Next>" before moving on.

## Examples

```
/ideation                                # all 6 types, 5 ideas each
/ideation security performance           # 2 types only
/ideation --max=10                       # all 6 types, 10 ideas each
/ideation security --max=8               # security only, 8 ideas
```
