# AeroOps

## AI-Powered Flight Operations & Incident Intelligence Platform

AeroOps is an operational intelligence dashboard designed to help airline, airport, and flight-dispatch teams quickly understand active flight disruptions, operational incidents, and airport conditions.

The project was developed as part of the **Kiro University Challenge 2026**, progressively incorporating Kiro Specs, Steering, Hooks, Property-Based Testing, Powers, MCP, and a Custom Agent.

---

## Kiro University Challenge 2026

AeroOps was developed progressively across seven challenge stages:

| Day | Kiro Capability | AeroOps Implementation |
|---|---|---|
| **Day 1** | Specs | Flight Operations Dashboard specification |
| **Day 2** | Steering | Product, architecture, and technical conventions |
| **Day 3** | Hooks | Automated type-check, lint, and test workflow |
| **Day 4** | Property-Based Testing | Flight Disruption Intelligence |
| **Day 5** | Powers | Reusable AeroOps Flight Operations domain expertise |
| **Day 6** | MCP | External operational context |
| **Day 7** | Custom Agent | AeroOps Operations Analyst |

---

# What AeroOps Does

AeroOps provides a centralized operational view containing:

- Flight operations metrics
- Disrupted flights
- Active operational incidents
- Airport operational status
- Incident severity
- Flight delay information
- Incident-linked disruption analysis
- Deterministic operational prioritization
- External operational context through MCP
- AI-assisted operational analysis through a specialized Kiro agent

The current iteration intentionally focuses on **read-only operational intelligence** using realistic mock data.

---

# Architecture

```text
                         AeroOps
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
     Project Data      AeroOps Power         MCP
          |                 |                 |
          |           Domain Knowledge   External Context
          |                 |                 |
          +-----------------+-----------------+
                            |
                            v
                  Operations Analyst
                            |
                            v
                    Domain View Model
                            |
                            v
                     Dashboard UI
````

### Application architecture

```text
app/
    Next.js App Router pages

components/
    Reusable UI components
    Dashboard components

lib/
    domain/
        Domain models and business rules

    data/
        Data-source abstraction
        Mock / HTTP implementations

    viewmodel/
        Dashboard presentation logic

tests/
    Unit tests
    Property-based tests

.kiro/
    agents/
    hooks/
    specs/
    steering/

tools/
    aeroops-flight-ops/
        Kiro Power
        Flight operations skill
        MCP configuration
```

The architecture keeps business logic outside React components and allows the mock data source to eventually be replaced by a backend without changing the dashboard UI.

---

# Core Domain Rules

## Active Incidents

An incident is considered active when its status is:

```text
OPEN
MONITORING
```

A `RESOLVED` incident is not active.

---

## Disrupted Flights

A flight is considered disrupted when **any** of the following is true:

```text
Flight status = DELAYED
Flight status = CANCELLED
Flight status = DIVERTED
Flight is linked to an active incident
```

A flight linked only to a resolved incident is not considered disrupted because of that link.

---

## Delay Detection

A flight is delayed when:

```text
status = DELAYED
```

or when its estimated departure is more than **15 minutes later** than its scheduled departure.

Delay duration is calculated from:

```text
estimated departure - scheduled departure
```

when the required timestamps are available.

---

## Incident Severity

AeroOps uses four severity levels:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

The deterministic severity ordering is:

```text
CRITICAL > HIGH > MEDIUM > LOW
```

Criticality is communicated through both visual styling and textual/programmatic indicators rather than color alone.

---

## Disrupted Flight Prioritization

Disrupted flights are ordered using the following deterministic rules:

1. Highest linked active-incident severity
2. Disruption type
3. Delay duration
4. Stable flight ID ordering

Disruption type ordering is:

```text
CANCELLED > DIVERTED > DELAYED
```

This makes prioritization deterministic and testable.

---

# Kiro Implementation

## Day 1 — Specs

Created the Flight Operations Dashboard specification under:

```text
.kiro/specs/flight-operations-dashboard/
```

The specification defines:

* Dashboard requirements
* Flight and incident behavior
* Severity
* Airport status
* Disruption detection
* Prioritization
* Data-source abstraction
* Loading, error, and empty states
* Testing and architecture requirements

The initial MVP deliberately excludes:

* Production backend
* MongoDB
* Authentication
* Real-time streaming
* Historical analytics
* Write operations

---

## Day 2 — Steering

Created:

```text
.kiro/steering/product.md
.kiro/steering/structure.md
.kiro/steering/tech.md
```

The steering establishes:

* Operational-first product principles
* Fast scanning under time pressure
* Explicit data states
* Separation of UI and business logic
* Domain-driven architecture
* Typed TypeScript
* Pure business logic
* Data-source abstraction
* Testing requirements

---

## Day 3 — Hooks

Created:

```text
.kiro/hooks/aeroops-quality-check.json
```

The hook is configured for relevant TypeScript and TSX source changes and runs:

```bash
npm run type-check
npm run lint
npm run test
```

The hook was configured and recognized by Kiro.

Automatic PostFileSave execution was not fully demonstrated during the challenge walkthrough, so this repository does not claim that automatic execution was independently verified.

---

## Day 4 — Property-Based Testing

Implemented Flight Disruption Intelligence.

Created and/or extended:

```text
lib/domain/incidentLinks.ts
lib/domain/disruption.ts

tests/incidentLinks.test.ts
tests/disruption.property.test.ts
```

Property-based tests using `fast-check` cover invariants including:

* Active incident classification
* Delay monotonicity
* 15-minute delay threshold
* Delay-duration consistency
* Disruption classification
* Severity ordering
* Deterministic ordering
* Permutation invariance
* Input immutability

The implementation was verified with:

```text
49 / 49 tests passing
```

along with successful type-check, lint, and production-build verification at that stage.

---

## Day 5 — AeroOps Flight Operations Power

Created a reusable Kiro Power:

```text
tools/aeroops-flight-ops/
```

The Power contains:

```text
plugin.json

skills/
└── flight-operations/
    ├── SKILL.md
    └── references/
        ├── domain-model.md
        ├── operational-rules.md
        ├── prioritization.md
        └── invariants.md

dev.kiro/
└── steering/
    └── conventions.md
```

The Power gives Kiro reusable knowledge about:

* Flight operations
* Flight states
* Incident lifecycle
* Disruption rules
* Severity
* Airport status
* Prioritization
* Domain invariants
* AeroOps terminology

The project remains the source of truth. External aviation concepts are not automatically introduced as AeroOps rules.

---

## Day 6 — MCP

AeroOps added external operational context using MCP.

The Power contains:

```text
tools/aeroops-flight-ops/mcp.json
```

with an external fetch server based on:

```text
mcp-server-fetch
```

MCP retrieval was successfully demonstrated during Day 6.

The external context test retrieved information about:

```text
Kempegowda International Airport (BLR)
```

The retrieved information was treated as external reference information rather than AeroOps operational state.

This distinction is intentional:

```text
External Source
      |
      v
     MCP
      |
      v
External Context
      |
      v
AeroOps Analysis
      |
      v
Existing Domain Rules
```

External information does **not** automatically become an AeroOps airport status, incident, or flight record.

---

## Day 7 — Custom Agent

Created:

```text
.kiro/agents/aeroops-ops-analyst.md
```

The **AeroOps Operations Analyst** is a read-oriented custom Kiro agent designed to analyze:

* Flights
* Disruptions
* Incidents
* Severity
* Operational priorities
* External operational context

The agent is configured to use:

* Project steering
* AeroOps Power
* Flight operations skill
* Project data
* External-context MCP when available

The agent is explicitly instructed to:

* Reuse existing domain logic
* Separate project facts from external facts
* Identify uncertainty
* Avoid inventing operational classifications
* Remain read-only

---

# Day 7 MCP Limitation

During the final Day 7 custom-agent test, the agent correctly identified the highest-priority active incident and associated disrupted flights.

However, the MCP fetch tool was **not surfaced in that particular agent session**.

Therefore:

```text
No external MCP retrieval occurred during that final Day 7 test.
```

The agent correctly reported that limitation rather than fabricating an external result or substituting an unrelated web search.

This repository therefore makes the following distinction:

```text
Day 6
MCP retrieval successfully demonstrated
        |
        v
Day 7
Custom agent configured for MCP
        |
        v
Final agent session did not expose MCP tool
        |
        v
No fabricated external context
```

---

# Testing

Run the complete verification suite with:

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

The project uses:

* TypeScript strict checking
* ESLint
* Vitest
* fast-check
* Production Next.js build verification

---

# Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Testing

* Vitest
* fast-check

### Kiro

* Specs
* Steering
* Hooks
* Powers
* MCP
* Custom Agents

### Planned Backend

The architecture is prepared for a future backend using:

* FastAPI
* Python
* MongoDB

The backend is intentionally outside the current MVP.

---

# Current Limitations

The current AeroOps implementation uses mock operational data.

It does not currently provide:

* Production flight-data integrations
* Real-time flight streaming
* Production incident feeds
* Persistent operational records
* Authentication
* Historical analytics
* Production aviation data ingestion
* Operational write actions

These are intentionally outside the current challenge MVP.

---

# Future Work

Potential future iterations include:

* FastAPI backend
* MongoDB persistence
* Live flight data
* Airport operational integrations
* Incident ingestion
* Historical disruption analytics
* Operational notifications
* Automated operational reports
* Expanded MCP integrations
* Authorized operational write workflows

Any mapping between external information and AeroOps domain classifications should first be introduced as an explicit domain requirement rather than inferred automatically.

---

# Repository Structure

```text
kiro-uni-challenge/
│
├── app/
│
├── components/
│   ├── SeverityBadge.tsx
│   └── dashboard/
│
├── lib/
│   ├── data/
│   ├── domain/
│   └── viewmodel/
│
├── tests/
│
├── tools/
│   └── aeroops-flight-ops/
│       ├── plugin.json
│       ├── mcp.json
│       ├── skills/
│       └── dev.kiro/
│
├── .kiro/
│   ├── agents/
│   ├── hooks/
│   ├── specs/
│   └── steering/
│
├── README.md
├── DEVLOG.md
├── package.json
└── package-lock.json
```

---

# Running AeroOps Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

Run validation:

```bash
npm run type-check
npm run lint
npm run test
npm run build
```

---

# Challenge Summary

AeroOps demonstrates a progressive Kiro development workflow:

```text
Specification
      ↓
Steering
      ↓
Hooks
      ↓
Property-Based Testing
      ↓
Reusable Domain Power
      ↓
External Context through MCP
      ↓
Specialized Operations Agent
```

The central design principle throughout the project is that **AI assistance operates within explicit project rules and domain boundaries rather than replacing them**.

The AeroOps domain model remains the source of truth for flight disruption, incident severity, prioritization, and operational state.
