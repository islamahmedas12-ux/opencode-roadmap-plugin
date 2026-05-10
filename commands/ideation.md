---
description: Generate AI-powered improvement ideas across 6 dimensions (code, UI/UX, docs, security, performance, code quality). Each type produces actionable ideas tied to the project's actual code.
agent: build
---

# /ideation — Generate Project Improvement Ideas

You are the orchestrator for a 6-type ideation pipeline. Each type produces a JSON file with actionable improvement ideas for the current project.

## Configuration

Project directory: `!`pwd``
Output directory: `!`pwd`/.auto-build/ideation`
Max ideas per type: 5 (default)

## Argument parsing

`$ARGUMENTS` may contain:
- `nothing` → run all 6 ideation types
- A space-separated list of types to run, e.g. `security performance` → run only those
- `--max=N` → override max ideas per type

Valid type names (use these exactly):
- `code_improvements`
- `code_quality`
- `documentation`
- `performance`
- `security`
- `ui_ux`

Subagent names are mapped:
- `code_improvements` → `@ideation-code-improvements`
- `code_quality` → `@ideation-code-quality`
- `documentation` → `@ideation-documentation`
- `performance` → `@ideation-performance`
- `security` → `@ideation-security`
- `ui_ux` → `@ideation-ui-ux`

Output file mapping:
- `code_improvements` → `code_improvements_ideas.json`
- `code_quality` → `code_quality_ideas.json`
- `documentation` → `documentation_gaps_ideas.json`
- `performance` → `performance_optimizations_ideas.json`
- `security` → `security_hardening_ideas.json`
- `ui_ux` → `ui_ux_improvements_ideas.json`

## Workflow

### Step 1: Setup

Create the output directory:
```bash
mkdir -p .auto-build/ideation
```

Determine the list of types to run from `$ARGUMENTS`. If empty or no valid types found, run all 6.

Determine `<max_ideas>` from `$ARGUMENTS` (look for `--max=N`); default to 5.

### Step 2: Run each ideation type SEQUENTIALLY

For each enabled type, invoke the corresponding subagent using the **Task tool**.

Pass this context block to each subagent:

```
Project Directory: <project_dir>
Output Directory: <output_dir>
Output File: <output_dir>/<output_filename_for_type>
Max Ideas: <max_ideas>

Analyze the project and generate up to <max_ideas> high-quality, specific, actionable ideas of type "<type_name>".

Use the available tools (Read, Glob, Grep, Bash) to explore the codebase. Read the project_index.json if it exists, plus README, package.json/equivalent, and key source files.

DEPTH REQUIREMENTS:
- Each idea must be SPECIFIC and ACTIONABLE — not generic ("improve testing" is bad; "add Jest snapshot tests for the 12 components in src/components/forms/" is good)
- Each idea must reference specific files, functions, or patterns observed in the code
- Each idea's `rationale` must explain why the code reveals this opportunity
- Each idea's `affected_files` must list real file paths from the project
- Use the schema and effort levels defined in your system prompt

Use the Write tool to create the Output File as a JSON array of idea objects.
```

After each Task() invocation, verify the output file was created:
```bash
test -f .auto-build/ideation/<output_filename> && echo "✓ <type> complete" || echo "✗ <type> FAILED"
```

If a type fails, log the error but CONTINUE with the next type. Do not abort the entire pipeline.

### Step 3: Aggregate results

After all types complete, read each `*_ideas.json` file and produce a summary.

```bash
echo "================================================"
echo "  ✓ Ideation pipeline complete"
echo "================================================"
echo ""
ls -la .auto-build/ideation/
echo ""

# Per-type summary
python3 - <<EOF
import json, os, glob
total = 0
print("Ideas generated per type:")
for f in sorted(glob.glob(".auto-build/ideation/*_ideas.json")):
    try:
        with open(f) as fp:
            data = json.load(fp)
        ideas = data if isinstance(data, list) else data.get("ideas", [])
        n = len(ideas)
        total += n
        print(f"  {os.path.basename(f):42s} {n} ideas")
    except Exception as e:
        print(f"  {os.path.basename(f):42s} ERROR: {e}")
print()
print(f"TOTAL: {total} ideas")
EOF
```

### Step 4: Optional — write a combined ideas.json

After step 3, create a combined `ideas.json` that merges all 6 outputs into a single file with type labels for easy filtering:

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
    if type_name == "ideas": continue
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

## Critical Rules

1. **Run types SEQUENTIALLY, not in parallel** — opencode handles one Task() at a time and parallel runs may cause rate limit issues
2. **Don't abort on individual failures** — if one type fails, continue with the others
3. **Use the Task tool to invoke subagents** (not direct prompts)
4. **Verify file existence** after each Task() before moving to the next
5. **Pass the EXACT context block** shown above to each subagent

## Output

When complete, the user will have:
- `.auto-build/ideation/code_improvements_ideas.json`
- `.auto-build/ideation/code_quality_ideas.json`
- `.auto-build/ideation/documentation_gaps_ideas.json`
- `.auto-build/ideation/performance_optimizations_ideas.json`
- `.auto-build/ideation/security_hardening_ideas.json`
- `.auto-build/ideation/ui_ux_improvements_ideas.json`
- `.auto-build/ideation/ideas.json` (combined)

## Examples

```
/ideation                                # all 6 types, 5 ideas each = up to 30 ideas
/ideation security performance           # only those 2 = up to 10 ideas
/ideation --max=10                       # all 6 types, 10 ideas each = up to 60 ideas
/ideation security --max=8               # only security, 8 ideas
```
