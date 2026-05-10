---
description: Generate a comprehensive product roadmap for the current project. Runs Discovery → Competitor Analysis → Features → Critic Refinement.
agent: build
---

# /roadmap — Generate Product Roadmap

You are the orchestrator for a comprehensive 4-phase roadmap generation pipeline.

## Configuration

Project directory: `!`pwd``
Output directory: `!`pwd`/.auto-build/roadmap`

If the user passed an argument as a project path, use `$ARGUMENTS` instead.

Skip competitor analysis if `$ARGUMENTS` contains `--no-competitor`.

## Workflow — execute strictly in order

### Step 1: Setup

Create the output directory if it doesn't exist:
```bash
mkdir -p .auto-build/roadmap
```

Set these paths in your context:
- `<project_dir>` = current working directory (or $ARGUMENTS if a path is given)
- `<output_dir>` = `<project_dir>/.auto-build/roadmap`
- `<discovery_file>` = `<output_dir>/roadmap_discovery.json`
- `<competitor_file>` = `<output_dir>/competitor_analysis.json`
- `<roadmap_file>` = `<output_dir>/roadmap.json`

---

### Step 2: Phase 1 — Discovery

Invoke the **roadmap-discovery** subagent using the Task tool. Pass it this context:

```
Project Directory: <project_dir>
Output Directory: <output_dir>
Output File: <discovery_file>

Analyze the project deeply. Read README, package.json (or equivalent), source structure, docs, and key code files. Then write the discovery JSON to the Output File path.

DEPTH REQUIREMENTS:
- target_audience.primary_persona must be SPECIFIC (not generic 'developers')
- target_audience.secondary_personas: at least 3
- target_audience.pain_points: at least 5 specific problems
- product_vision.problem_statement: at least 2 sentences
- current_state.existing_features: at least 8 actual features observed
- current_state.known_gaps: at least 3 specific gaps
- competitive_context.alternatives: at least 5 named competitors
- constraints.technical: at least 3 specific constraints

Use the Write tool to create the file. Do NOT just print JSON.
```

**Wait for the subagent to complete.** Then verify the file exists:
```bash
test -f <output_dir>/roadmap_discovery.json && echo "✓ Discovery complete" || echo "✗ Discovery FAILED"
```

If the file is missing, abort with an error message.

---

### Step 3: Phase 2 — Competitor Analysis (skip if `--no-competitor`)

If skipping, jump to Step 4.

Invoke the **competitor-analysis** subagent using the Task tool. Pass it this context:

```
Discovery File: <discovery_file>
Output Directory: <output_dir>
Output File: <competitor_file>

Read the discovery JSON, then research 5 competitors using the WebSearch tool. Find real pain points from GitHub Issues, forums, reviews, and documentation. Write the competitor analysis JSON.

DEPTH REQUIREMENTS:
- Identify exactly 5 competitors (at least 3 with relevance:high)
- Each competitor MUST have at least 3 pain_points with REAL sources
- Each pain_point.source must reference a real source (GitHub Issues URL, forum thread, doc page)
- market_gaps: at least 4 entries
- insights_summary.top_pain_points: at least 5 cross-competitor patterns
- insights_summary.differentiator_opportunities: at least 4 opportunities
- Use WebSearch extensively (minimum 5 searches)

Use the Write tool to create the file.
```

Wait, then verify:
```bash
test -f <output_dir>/competitor_analysis.json && echo "✓ Competitor complete" || echo "✗ Competitor FAILED"
```

---

### Step 4: Phase 3 — Features Generation

Invoke the **roadmap-features** subagent using the Task tool. Pass it this context:

```
Discovery File: <discovery_file>
Competitor Analysis File: <competitor_file> (may not exist if skipped)
Output Directory: <output_dir>
Output File: <roadmap_file>

Read the discovery and competitor data. Generate a comprehensive roadmap with prioritized features using MoSCoW. Write the roadmap JSON.

DEPTH REQUIREMENTS:
- Generate AT LEAST 12 features (target 15-20)
- 4 phases (Foundation, Enhancement, Enterprise, Scale)
- Each phase: 2-3 milestones
- Each feature MUST have:
  * acceptance_criteria: at least 6 specific, testable items (HTTP codes, timeouts, algorithms, exact thresholds)
  * user_stories: at least 3 stories in "As a X, I want Y so that Z" format
  * rationale: at least 2 sentences linking to specific competitor pain points or discovery insights
  * competitor_insight_ids: array referencing IDs from competitor_analysis.json
- Priorities: at least 3 must, 4 should, 4 could
- Be SPECIFIC: numbers, protocols, algorithms, exact behaviors

Use the Write tool to create the file.
```

Wait, then verify:
```bash
test -f <output_dir>/roadmap.json && echo "✓ Features complete" || echo "✗ Features FAILED"
```

---

### Step 5: Phase 4 — Critic + Refinement

Invoke the **roadmap-critic** subagent using the Task tool. Pass it this context:

```
Discovery File: <discovery_file>
Competitor Analysis File: <competitor_file>
Roadmap File: <roadmap_file> (this is what you'll review and improve)
Output Directory: <output_dir>

Read the current roadmap, identify the 3-5 weakest features, and rewrite the roadmap with deeper specificity. Add missing features if total < 15. Maintain the exact schema. Document changes in metadata.critic_review.

Use the Write tool to overwrite roadmap.json.
```

---

### Step 6: Final summary

Print a summary using bash:
```bash
echo "================================================"
echo "  ✓ Roadmap generation complete"
echo "================================================"
echo ""
ls -la <output_dir>/
echo ""
# Quick stats from roadmap.json
node -e "
const r = JSON.parse(require('fs').readFileSync('<roadmap_file>', 'utf-8'));
console.log('Project:', r.project_name);
console.log('Vision :', (r.vision || '').substring(0, 80));
console.log('Phases :', (r.phases || []).length);
console.log('Features:', (r.features || []).length);
const feats = r.features || [];
const totalAC = feats.reduce((s, f) => s + ((f.acceptance_criteria || []).length), 0);
const totalUS = feats.reduce((s, f) => s + ((f.user_stories || []).length), 0);
console.log('Avg AC/feat:', feats.length ? (totalAC/feats.length).toFixed(1) : 0);
console.log('Avg US/feat:', feats.length ? (totalUS/feats.length).toFixed(1) : 0);
" 2>/dev/null || python3 -c "
import json
r = json.load(open('<roadmap_file>'))
print('Project:', r.get('project_name'))
print('Vision :', (r.get('vision') or '')[:80])
print('Phases :', len(r.get('phases', [])))
print('Features:', len(r.get('features', [])))
feats = r.get('features', [])
ac = sum(len(f.get('acceptance_criteria', [])) for f in feats)
us = sum(len(f.get('user_stories', [])) for f in feats)
print(f'Avg AC/feat: {ac/len(feats):.1f}' if feats else 'no features')
print(f'Avg US/feat: {us/len(feats):.1f}' if feats else 'no features')
"
```

---

## Critical Rules

1. Run phases STRICTLY in order — each depends on the previous
2. Verify file existence after each phase before continuing
3. If a phase fails (file not created), STOP and report the error
4. Use the Task tool to invoke subagents (not direct prompts)
5. Each Task call should pass the EXACT context shown above

## Output

When complete, the user will have:
- `.auto-build/roadmap/roadmap_discovery.json` — project understanding
- `.auto-build/roadmap/competitor_analysis.json` — competitor insights (if not skipped)
- `.auto-build/roadmap/roadmap.json` — the final roadmap with prioritized features
