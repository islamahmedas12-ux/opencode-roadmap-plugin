---
description: Generate a comprehensive product roadmap for the current project. Runs Discovery → Competitor Analysis → Features → Critic Refinement, and PRINTS each phase's output in detail in the chat.
agent: build
---

# /roadmap — Generate Product Roadmap

You are the orchestrator for a 4-phase roadmap generation pipeline. **CRITICAL CHAT-OUTPUT RULE**: after every phase completes, you MUST print the phase's output in detail in the chat (not just "done"). The user wants the content in the conversation context for follow-up questions, not just files on disk.

## Configuration

Project directory: `!`pwd``
Output directory: `!`pwd`/.auto-build/roadmap`

If the user passed an argument as a project path, use `$ARGUMENTS` instead. Skip competitor analysis if `$ARGUMENTS` contains `--no-competitor`.

## Path variables

- `<project_dir>` = current working directory (or `$ARGUMENTS` if a path is given)
- `<output_dir>` = `<project_dir>/.auto-build/roadmap`
- `<discovery_file>` = `<output_dir>/roadmap_discovery.json`
- `<competitor_file>` = `<output_dir>/competitor_analysis.json`
- `<roadmap_file>` = `<output_dir>/roadmap.json`

## Workflow — execute strictly in order

### Step 1: Setup

```bash
mkdir -p .auto-build/roadmap
```

---

### Step 2: Phase 1 — Discovery

Invoke the **roadmap-discovery** subagent using the Task tool with this context:

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

Use the Write tool to create the file.
```

**Verify:**
```bash
test -f <discovery_file> && echo "✓ Discovery complete" || { echo "✗ Discovery FAILED"; exit 1; }
```

**REQUIRED CHAT OUTPUT — Print after Phase 1 completes:**

Read `<discovery_file>` and print its contents to the chat in markdown format. Do NOT skip this. Format:

```markdown
## 📋 Phase 1 — Discovery

**Project**: <project_name>  ·  **Type**: <project_type>  ·  **Maturity**: <maturity>

### Tech stack
- Primary language: <primary_language>
- Frameworks: <frameworks>
- Key dependencies: <key_dependencies>

### Target audience
**Primary persona**: <primary_persona>

**Secondary personas**:
- <each persona>

**Pain points** (<count>):
- <each pain point>

**Goals**:
- <each goal>

**Usage context**: <usage_context>

### Product vision
- **One-liner**: <one_liner>
- **Problem statement**: <problem_statement>
- **Value proposition**: <value_proposition>
- **Success metrics**: <each metric>

### Current state
**Existing features** (<count>):
- <each existing feature>

**Known gaps**:
- <each gap>

**Technical debt**:
- <each item>

### Competitive context
- **Alternatives**: <each>
- **Differentiators**: <each>
- **Market position**: <market_position>

### Constraints
- **Technical**: <each>
- **Resources**: <each>
- **Dependencies**: <each>
```

Print every field. Do not abbreviate.

---

### Step 3: Phase 2 — Competitor Analysis (skip if `--no-competitor`)

Invoke **competitor-analysis** subagent with this context:

```
Discovery File: <discovery_file>
Output Directory: <output_dir>
Output File: <competitor_file>

Read the discovery JSON, then research 5 competitors using the WebSearch tool. Find real pain points from GitHub Issues, forums, reviews, and documentation.

DEPTH REQUIREMENTS:
- Identify exactly 5 competitors (at least 3 with relevance:high)
- Each competitor MUST have at least 3 pain_points with REAL sources
- Each pain_point.source must reference a real source (GitHub Issues URL, forum thread, doc page)
- market_gaps: at least 4 entries
- insights_summary.top_pain_points: at least 5 cross-competitor patterns
- insights_summary.differentiator_opportunities: at least 4 opportunities
- Use WebSearch extensively (minimum 5 searches)

Use the Write tool.
```

**Verify:**
```bash
test -f <competitor_file> && echo "✓ Competitor complete" || { echo "✗ Competitor FAILED"; exit 1; }
```

**REQUIRED CHAT OUTPUT — Print after Phase 2:**

Read `<competitor_file>` and print in markdown:

```markdown
## 🔍 Phase 2 — Competitor Analysis

**Competitors analyzed**: <count> · **Pain points found**: <total> · **Market gaps**: <count>

### Competitors

#### 1. <name> (<relevance>)
- **URL**: <url>
- **Position**: <market_position>
- **Description**: <description>
- **Strengths**: <each>
- **Pain points** (<count>):
  - **[<severity>]** <description>
    - Source: <source>
    - Frequency: <frequency>
    - Opportunity: <opportunity>

[repeat for each competitor]

### Market gaps
- **[<opportunity_size>]** <description>
  - Affects: <affected_competitors>
  - Suggested feature: <suggested_feature>

[repeat for each gap]

### Cross-competitor insights
**Top pain points**:
- <each>

**Differentiator opportunities**:
- <each>

**Market trends**:
- <each>
```

Print every competitor with all pain points and sources. Do not abbreviate.

---

### Step 4: Phase 3 — Features Generation

Invoke **roadmap-features** with this context:

```
Discovery File: <discovery_file>
Competitor Analysis File: <competitor_file> (may not exist)
Output Directory: <output_dir>
Output File: <roadmap_file>

Read discovery and competitor data. Generate a roadmap with prioritized features using MoSCoW.

DEPTH REQUIREMENTS:
- AT LEAST 12 features (target 15-20)
- 4 phases (Foundation, Enhancement, Enterprise, Scale)
- Each phase: 2-3 milestones
- Each feature MUST have:
  * acceptance_criteria: at least 6 specific testable items (HTTP codes, timeouts, algorithms)
  * user_stories: at least 3 stories ("As a X, I want Y so that Z")
  * rationale: at least 2 sentences linking to specific competitor pain points
  * competitor_insight_ids: array referencing IDs from competitor_analysis.json
- Priorities: at least 3 must, 4 should, 4 could
- Be SPECIFIC: numbers, protocols, algorithms, exact behaviors

Use the Write tool.
```

**Verify:**
```bash
test -f <roadmap_file> && echo "✓ Features complete" || { echo "✗ Features FAILED"; exit 1; }
```

**REQUIRED CHAT OUTPUT — Print after Phase 3:**

Read `<roadmap_file>` and print every feature in detail:

```markdown
## 🎯 Phase 3 — Features (initial pass)

**Features**: <count> · **Phases**: <count>

### Phase breakdown
- **<phase_name>** (<feature_count> features) — <description>
  - Milestones: <each milestone title>

[repeat for each phase]

### Features

#### <feature_id>: <title>  ·  [<priority>] complexity=<complexity> impact=<impact>
**Phase**: <phase_id>

**Description**: <description>

**Rationale**: <rationale>

**Acceptance criteria** (<count>):
- <each AC>

**User stories**:
- <each user story>

**Linked competitor insights**: <competitor_insight_ids>

**Dependencies**: <dependencies if any>

---

[repeat for each feature]
```

Print every feature with full content. The user wants the data in the chat, not just in the file.

---

### Step 5: Phase 4 — Critic Refinement

Invoke **roadmap-critic** with this context:

```
Discovery File: <discovery_file>
Competitor Analysis File: <competitor_file>
Roadmap File: <roadmap_file>
Output Directory: <output_dir>

Read the current roadmap, identify the 3-5 weakest features, rewrite the roadmap with deeper specificity. Add missing features if total < 15. Maintain the schema. Document changes in metadata.critic_review.

Use the Write tool to overwrite roadmap.json.
```

**REQUIRED CHAT OUTPUT — Print after Phase 4:**

Read the updated `<roadmap_file>` and print:

```markdown
## ✨ Phase 4 — After Critic Refinement

### Changes from critic
- **Weak features strengthened**: <list from metadata.critic_review.weak_features_strengthened>
- **Features added**: <list from metadata.critic_review.features_added>
- **Key improvements**: <list from metadata.critic_review.key_improvements>

### Final feature list

[Print every feature again with the same structure as Phase 3 — full content, no abbreviation]
```

---

### Step 6: Final summary

```bash
echo "================================================"
echo "  ✓ /roadmap pipeline complete"
echo "================================================"
ls -la .auto-build/roadmap/
```

Then print one final markdown summary:

```markdown
## 📊 Final summary

- **Project**: <project_name>
- **Vision**: <vision>
- **Phases**: <count>
- **Features**: <count> (must=<n>, should=<n>, could=<n>, won't=<n>)
- **Avg AC/feature**: <avg>
- **Avg user stories/feature**: <avg>

### Files written
- `.auto-build/roadmap/roadmap_discovery.json`
- `.auto-build/roadmap/competitor_analysis.json` (if not skipped)
- `.auto-build/roadmap/roadmap.json`

### Top 5 must-have features
1. <title> — <one-line description>
2. ...
```

## Critical rules

1. **PRINT EVERY PHASE'S OUTPUT IN THE CHAT IN FULL** — not summaries, not "done", not "see file". Full content in markdown so the user can ask follow-up questions without re-reading the JSON.
2. Run phases STRICTLY in order — each depends on the previous.
3. Verify file existence after each phase. If missing, STOP and report the error.
4. Use the Task tool to invoke subagents (not direct prompts).
5. Pass the EXACT context block shown above to each subagent.
6. After printing each phase's data, briefly state "Phase X complete — proceeding to Phase Y" before moving on.
