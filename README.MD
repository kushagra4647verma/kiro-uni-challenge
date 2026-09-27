# **AeroOps** 

AI-Powered Flight Operations & Incident Intelligence — Kiro University Challenge 2026 

## **Overview** 

AeroOps is an AI-powered Flight Operations and Incident Intelligence platform designed to help airline, airport, and flight-dispatch teams understand active disruptions, incidents, and operational priorities. 

The project was built progressively through the Kiro University Challenge using specification-driven development, steering, hooks, property-based testing, Powers, MCP, and custom-agent capabilities. 

## **Challenge Journey** 

|**Day**|**Kiro Capability**|**AeroOps Implementation**|
|---|---|---|
|1|Specs|Flight Operations Dashboard|
|2|Steering|Product, technical, and structural guidance|
|3|Hooks|Automated quality checks|
|4|Property-Based Testing|Flight Disruption Intelligence|
|5|Powers|AeroOps Flight Operations Power|
|6|MCP|External Operational Context|
|7|Custom Agent|AeroOps Operations Analyst|



## **Architecture** 



<!-- Start of picture text -->
                         AeroOps Operations Analyst<br>                                      |<br>                 +--------------------+--------------------+<br>                 |                    |                    |<br>                 v                    v                    v<br>           Project Data         AeroOps Power             MCP<br>                 |                    |                    |<br>                 |              Domain knowledge       External context<br>                 |              Rules / invariants<br>                 +--------------------+--------------------+<br>                                      |<br>                                      v<br>                              Operational Analysis<br>                                      |<br>                                      v<br>                              AeroOps Dashboard<br><!-- End of picture text -->

## **Core Domain Rules** 

**Incident severity:** CRITICAL > HIGH > MEDIUM > LOW 

**Active incidents:** OPEN and MONITORING. RESOLVED incidents are not active. 

**Disrupted flights:** DELAYED, CANCELLED, DIVERTED, or linked to an active incident. 

**Disrupted-flight prioritization:** highest linked active-incident severity, then disruption type, then delay duration, then flight ID. 

**Disruption type:** CANCELLED > DIVERTED > DELAYED. 

## **Technology** 

Next.js, React, TypeScript, Tailwind CSS, Vitest, fast-check, Kiro Powers, Kiro MCP, and Kiro Custom Agents. Future backend direction: FastAPI, Python, and MongoDB. 

## **Testing** 

```
npm run type-check
npm run lint
npm run test
npm run build
```

The Day 4 implementation recorded 49 / 49 tests passing, alongside successful type-check, lint, and production-build verification at that stage. 

## **Kiro Capabilities** 

**Specs:** Formal product requirements and domain behavior. 

**Steering:** Persistent product, architecture, and technical conventions. 

**Hooks:** Automated quality checks for relevant source changes. 

**Property-Based Testing:** Executable domain invariants using fast-check. 

**Powers:** Reusable AeroOps-specific domain expertise. 

**MCP:** External operational context without redefining the domain model. 

**Custom Agent:** Read-oriented AeroOps Operations Analyst. 

## **MCP Boundary** 



<!-- Start of picture text -->
External Source<br>      |<br>      v<br>     MCP<br>      |<br>      v<br>External Context<br>      |<br>      v<br>AeroOps reasoning<br>      |<br>      v<br>Existing domain rules<br><!-- End of picture text -->

External information is not automatically converted into AeroOps domain state. 

## **Day 7 MCP Limitation** 

The Day 7 Operations Analyst was configured with access to the external-context MCP server and successfully analyzed project data using the AeroOps domain rules. However, during the final Day 7 MCP-backed test, the MCP fetch tool was not surfaced in that particular agent session. 

The agent reported that no external retrieval occurred, did not substitute web search, and did not fabricate an MCP result. Therefore the project does not claim that the final Day 7 test successfully performed an MCP retrieval. Day 6 independently demonstrated successful MCP retrieval. 

## **Current Limitations** 

AeroOps currently uses mock operational data and does not yet provide a production backend, real-time flight feeds, authentication, persistent operational records, live airline/airport integrations, historical analytics, production aviation 

data ingestion, or write operations. 

## **Future Work** 

Potential next steps include a FastAPI backend, MongoDB persistence, live flight data, airport and incident ingestion, historical analytics, notifications, richer MCP integrations, automated reports, and explicitly authorized write workflows. 

Detailed Day 1–7 history is provided in the accompanying DEVLOG document. 

