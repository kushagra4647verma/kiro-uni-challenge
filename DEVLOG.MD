# **AeroOps — Kiro University Challenge 2026** 

Detailed Day 1–7 Development Log 

## **Day 1 — Specification-Driven Development** 

Created the Flight Operations Dashboard specification under .kiro/specs/flight-operations-dashboard/. 

The specification established dashboard summary metrics, disrupted flights, recent incidents, airport operational status, incident severity, disruption rules, deterministic prioritization, a data-source abstraction, loading/error/empty states, TypeScript requirements, and architectural constraints. 

The first iteration was intentionally frontend-focused and used realistic mock data through a data-source abstraction so a future FastAPI/MongoDB backend can replace the data source without rewriting the dashboard. 

## **Day 2 — Steering** 

Created .kiro/steering/product.md, structure.md, and tech.md. 

Product steering established fast operational scanning, clear critical information, explicit data states, meaningful empty/loading/error states, and operational information over decoration. 

Structure steering separated app/, components/, lib/domain/, lib/data/, lib/viewmodel/, and tests/. Business logic remains outside React and the UI consumes data through abstractions. 

Technical steering established Next.js App Router, TypeScript, Tailwind CSS, strict typing, typed domain models, framework-independent business logic, explicit API contracts, minimal dependencies, and testing before feature completion. 

An incident-severity-badge specification was also introduced to formalize reuse of the existing severity badge. 

## **Day 3 — Hooks** 

Created .kiro/hooks/aeroops-quality-check.json. 

The hook targets TypeScript/TSX files under app/, components/, lib/, and tests/, and runs npm run type-check, npm run lint, and npm run test in sequence. 

The hook was created and recognized by Kiro. Automatic post-save execution was not fully demonstrated during the challenge walkthrough, so the project does not claim that successful automatic execution was verified. 

## **Day 4 — Property-Based Testing** 

Built Flight Disruption Intelligence and strengthened the domain layer. 

Created/restructured lib/domain/incidentLinks.ts and lib/domain/disruption.ts. highestSeverityActiveIncident became reusable domain logic and the dashboard view model was updated to reuse it. 

Added fast-check and tests/disruption.property.test.ts. Properties covered active-status exclusivity, delay monotonicity, the 15-minute threshold, delay-duration consistency, disruption classification, severity ordering, deterministic ordering, permutation invariance, and input immutability. 

Added tests/incidentLinks.test.ts for example-based incident-linking behavior. 

The implementation report recorded 49 / 49 tests passing, along with successful strict type-check, lint, and production-build verification at that stage. 

## **Day 5 — AeroOps Flight Operations Power** 

Created tools/aeroops-flight-ops/ as an Agent Plugins Power. 

The Power contains plugin.json, the flight-operations skill, reference files for the domain model, operational rules, prioritization, invariants, and scoped Kiro steering. 

The Power captures flight states, active-flight semantics, delay and disruption rules, incident lifecycle, severity, airport status, prioritization, deterministic ordering, invariants, terminology, and project conventions. 

The Power explicitly treats the AeroOps project as the source of truth and does not introduce external aviation regulations unless AeroOps explicitly adopts them. 

Activation tests showed Kiro tracing domain questions to the Power references and existing implementation rather than inventing generic aviation rules. 

## **Day 6 — MCP** 

Added external operational context using mcp-server-fetch through uvx. 

The server was exposed as aeroops-external-context with a fetch tool. Initial diagnosis confirmed uvx was available and that mcp-server-fetch could start and complete an MCP initialization handshake. 

After connecting the server in Kiro, a basic MCP retrieval successfully fetched https://example.com without using web search. 

The AeroOps-specific test then used the MCP fetch tool to retrieve 

https://en.wikipedia.org/wiki/Kempegowda_International_Airport. The result provided descriptive information about BLR but did not provide live operational status. 

The AeroOps mock data did not contain BLR, and the domain model contains no rule that maps arbitrary external information into NORMAL, MINOR_DELAYS, MAJOR_DELAYS, or CLOSED. No BLR record or status was invented. 

The architectural boundary established on Day 6 is: 

External Source -> MCP -> External Context -> AeroOps reasoning -> Existing domain rules. 

External facts do not automatically become AeroOps domain state. 

## **Day 7 — AeroOps Operations Analyst** 

Created .kiro/agents/aeroops-ops-analyst.md. 

The custom agent is a read-oriented flight-operations analyst with access to read tools, the external-context MCP server, the AeroOps Power, project steering, and the flight-operations skill. 

The agent is instructed to use project data and existing domain logic, distinguish project facts from external facts, 

identify uncertainty, avoid inventing classifications, and remain read-only. 

The first Day 7 test analyzed the current mock snapshot. It identified inc-1 — Winter storm ground stop at ORD — as the highest-priority active incident under the project's deterministic severity ordering. The associated highest-priority disrupted flights were fl-3, fl-11, and fl-18. 

The agent also correctly handled a flight linked only to a RESOLVED incident and did not classify that flight as disrupted through the resolved link. 

## **Day 7 — Final MCP-Backed Test Limitation** 

The final Day 7 test asked the agent to identify the highest-priority disruption and determine whether external context would materially help explain it. 

The agent correctly identified inc-1 and recognized that the project data already contained substantial information about the cause and impact. 

It then attempted to use the external-context MCP server. However, the MCP fetch tool was not surfaced in that particular Day 7 agent session. 

No external source was retrieved during that test. 

The agent correctly reported the limitation, did not substitute web search, and did not fabricate external information. 

This distinction is important: 

Day 6 demonstrated actual MCP retrieval. 

Day 7 demonstrated that the custom agent is configured to use the MCP capability and correctly handles its absence, but the final Day 7 test itself did not retrieve external MCP data. 

The project therefore makes no claim that the final Day 7 test successfully performed an MCP-backed retrieval. 

## **Final Architecture** 

The completed architecture combines: 

Project data | AeroOps Power | MCP external context | Custom Operations Analyst | Evidence-based operational analysis 

The project deliberately separates project facts, domain rules, external context, and AI analysis. 

## **Lessons From the Challenge** 

The seven-day progression demonstrated how AI-assisted development becomes more useful when progressively stronger context is encoded into the project. 

Specification -> Steering -> Automated Validation -> Executable Invariants -> Reusable Domain Knowledge -> External Context -> Specialized Agent. 

Each layer solves a different problem while preserving the domain model as the source of truth. 

## **Current Limitations and Future Work** 

AeroOps currently uses mock operational data. It does not yet provide a production backend, real-time flight feeds, authentication, persistent operational records, live airline/airport integrations, historical analytics, production aviation data ingestion, or write operations. 

Potential future work includes FastAPI, MongoDB, live flight data, airport and incident ingestion, historical analytics, notifications, richer MCP integrations, automated operational reports, and explicitly authorized write workflows. 

Any future mapping between external information and AeroOps domain classifications should first become an explicit product/domain requirement. 

