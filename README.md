# opencode-roadmap-plugin

Generate a comprehensive product roadmap for any project — using [opencode](https://opencode.ai/) as the harness, with Aperant-quality output at MiniMax-M2.7 cost.

A 4-phase pipeline: **Discovery → Competitor Analysis → Features → Critic Refinement**. Output is a structured `roadmap.json` with 15-20 prioritized features, each with 6+ acceptance criteria, 3+ user stories, and links to specific competitor pain points.

## What you get

```
.auto-build/roadmap/
├── roadmap_discovery.json     ← project understanding (audience, vision, gaps)
├── competitor_analysis.json   ← 5 competitors with real pain points & sources
└── roadmap.json               ← 15-20 prioritized features in 4 phases
```

Each feature includes:
- MoSCoW priority (must / should / could / won't)
- Complexity & impact scores
- 6+ specific, testable acceptance criteria (HTTP codes, timeouts, algorithms)
- 3+ user stories ("As a X, I want Y so that Z")
- Rationale linked to specific competitor pain points or discovery insights

## Why this exists

Inspired by [Aperant](https://github.com/AndyMik90/Aperant)'s "Generate Roadmap" feature. Aperant is an Electron app that uses Claude Code + Vercel AI SDK. This plugin delivers comparable output quality through opencode's subagent system, with two notable differences:

1. **Model agnostic** — works with any opencode-supported model (Claude, MiniMax, GPT, etc.)
2. **Cheaper** — MiniMax-M2.7 produces ~85% the depth at ~10% the cost
3. **Native opencode** — no separate UI; works inside the opencode TUI you already use

## Quick start

### 1. Install opencode

If you haven't already: https://opencode.ai/

### 2. Install the plugin

```bash
git clone https://github.com/<your-username>/opencode-roadmap-plugin.git
cd opencode-roadmap-plugin
./install.sh
```

This copies agents to `~/.config/opencode/agents/` and the command to `~/.config/opencode/commands/`.

### 3. Configure model + MCP

Copy `opencode.json.example` and edit for your environment:

**Using MiniMax (cheap, recommended)**:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    }
  },
  "provider": {
    "anthropic": {
      "options": {
        "baseURL": "https://api.minimax.io/anthropic",
        "apiKey": "{env:MINIMAX_API_KEY}"
      },
      "models": {
        "MiniMax-M2.7": {}
      }
    }
  }
}
```

Set the env var:
```bash
export MINIMAX_API_KEY=your_key_here
```

**Using Claude (highest quality)**: just use opencode's default Anthropic config. No changes needed.

### 4. Run

In any project directory:
```bash
opencode
```

Then in opencode:
```
/roadmap
```

Or skip competitor research (faster, no internet):
```
/roadmap --no-competitor
```

## How it works

```
User runs /roadmap in opencode
        │
        ▼
Primary agent reads the slash command, then:
        │
        ├──► Task(roadmap-discovery) ──► roadmap_discovery.json
        │
        ├──► Task(competitor-analysis) ──► competitor_analysis.json
        │       (uses WebSearch + context7 for real research)
        │
        ├──► Task(roadmap-features) ──► roadmap.json
        │       (15-20 features, MoSCoW, 6+ AC each)
        │
        └──► Task(roadmap-critic) ──► refines roadmap.json
                (strengthens weak features, adds missing ones)
```

Each subagent is isolated:
- Has its own context window
- Has its own permissions (deny edit/bash where unnecessary)
- Has its own system prompt with strict depth requirements

## File structure

```
opencode-roadmap-plugin/
├── agents/
│   ├── roadmap-discovery.md      ← Phase 1 subagent
│   ├── competitor-analysis.md    ← Phase 2 subagent
│   ├── roadmap-features.md       ← Phase 3 subagent
│   └── roadmap-critic.md         ← Phase 4 subagent
├── commands/
│   └── roadmap.md                 ← /roadmap orchestrator
├── opencode.json.example          ← config template
├── install.sh                     ← installer
├── LICENSE                        ← AGPL-3.0
└── README.md
```

## Output schema

### roadmap_discovery.json
```json
{
  "project_name": "...",
  "project_type": "web-app|mobile-app|cli|library|api|desktop-app|other",
  "tech_stack": { "primary_language": "...", "frameworks": [], "key_dependencies": [] },
  "target_audience": {
    "primary_persona": "...",
    "secondary_personas": [],
    "pain_points": [],
    "goals": [],
    "usage_context": "..."
  },
  "product_vision": { "one_liner": "...", "problem_statement": "...", "value_proposition": "...", "success_metrics": [] },
  "current_state": { "maturity": "idea|prototype|mvp|growth|mature", "existing_features": [], "known_gaps": [], "technical_debt": [] },
  "competitive_context": { "alternatives": [], "differentiators": [], "market_position": "..." },
  "constraints": { "technical": [], "resources": [], "dependencies": [] }
}
```

### roadmap.json
```json
{
  "id": "roadmap-<timestamp>",
  "project_name": "...",
  "vision": "...",
  "phases": [{ "id": "...", "name": "...", "description": "...", "milestones": [...], "features": [...] }],
  "features": [
    {
      "id": "feature-1",
      "title": "...",
      "description": "...",
      "rationale": "Links to specific pain points",
      "priority": "must|should|could|wont",
      "complexity": "low|medium|high",
      "impact": "low|medium|high",
      "acceptance_criteria": ["...", "..."],
      "user_stories": ["As a X, I want Y so that Z"],
      "competitor_insight_ids": ["pain-1-1", "gap-2"]
    }
  ]
}
```

## Performance

Benchmarks on real projects (with MiniMax-M2.7):

| Project | Phases | Features | Avg AC/feat | Time | Cost |
|---|---|---|---|---|---|
| AuthMe (NestJS IAM, 5K+ files) | 4 | 20 | 8.4 | ~12 min | ~$0.30 |
| Real Estate CRM (NestJS+React+Flutter) | 4 | 20 | 6.9 | ~13 min | ~$0.35 |
| Commander.js (Node CLI library) | 4 | 15 | 6+ | ~8 min | ~$0.20 |

For comparison: Aperant + Claude Sonnet 4.6 produces ~10 AC/feat at ~$2-3/run in ~15-16 min.

## Tips

- **Run on a fresh project**: phases skip if output files already exist. Delete `.auto-build/roadmap/` to regenerate.
- **Use `--no-competitor`** if your project is in a niche without obvious competitors, or you don't want web research.
- **Improve quality**: re-run critic phase manually via `@roadmap-critic` to do another refinement pass.
- **Customize**: edit `agents/roadmap-features.md` to change priority distribution or feature count targets.

## Troubleshooting

**`/roadmap` not found**: Make sure you ran `./install.sh` and `~/.config/opencode/commands/roadmap.md` exists.

**"Subagent not found"**: Check `~/.config/opencode/agents/` has all 4 `.md` files.

**MCP context7 errors**: Free tier has rate limits. Get a free API key at https://context7.com/dashboard and add to your config.

**Output too generic**: Re-run with `@roadmap-critic` for another refinement pass. Or check that your model is at least Sonnet/Opus level (small models struggle with depth).

**Phase fails mid-way**: Check `.auto-build/roadmap/` for partial outputs. The pipeline can resume — just re-run `/roadmap`.

## Credits

The prompts are derived from [Aperant](https://github.com/AndyMik90/Aperant) (formerly Auto-Claude) by [@AndyMik90](https://github.com/AndyMik90), licensed AGPL-3.0. This plugin extends them for opencode and adds explicit depth directives, a critic refinement phase, and stricter schema validation.

## License

AGPL-3.0 — derivative of Aperant. See [LICENSE](./LICENSE).

If you modify and distribute, or run as a service, your code must also be open source under AGPL-3.0.
