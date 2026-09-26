# Product

## What AeroOps is

AeroOps is an AI-powered Flight Operations and Incident Intelligence Platform. It gives airline and airport operations teams a single place to understand the current state of flight operations — flights, disruptions, incidents, and operational impact — so they can act on what matters.

## Primary users

- Airline operations teams
- Airport operations teams
- Flight dispatch and operational control teams

These are operational users under time pressure making real decisions. Design for scanning and speed, not for casual browsing.

## Primary product goal

Provide fast situational awareness of flight disruptions, operational incidents, and airport constraints. A user should be able to open AeroOps and immediately understand what is going wrong and where attention is needed.

## Product principles

- **Operationally relevant information should be easy to find.** Surface what an operations user needs to act on; keep it above the noise.
- **Critical information should be prioritized.** The most severe and time-sensitive items come first, both in ordering and in visual weight.
- **Data should be explicit rather than ambiguous.** Prefer clear values over blanks or guesses. Missing or not-applicable data should say so plainly (e.g. "None", "N/A") rather than leaving a gap.
- **Empty, loading, and error states must communicate clearly.** A user must never mistake a loading, empty, or failed view for real operational data.
- **Avoid decorative UI that competes with operational information.** Visual treatment serves comprehension. If a styling choice does not help a user act faster or more correctly, it does not belong.
- **Features should be designed around real operational workflows.** Model the domain and the way operations teams actually work, not abstract screens.

## Signaling and accessibility

State that matters operationally (severity, degraded status, disruption) must be conveyed by more than color alone — text labels and explicit indicators — so it is unambiguous and accessible.

## MVP principle

Prefer a small working feature over speculative functionality. Ship a focused, correct capability and extend it based on real need rather than building broad, unused surface area. Favor depth and reliability on the workflows users actually have.
