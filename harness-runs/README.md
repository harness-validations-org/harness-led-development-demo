# Harness runs

Each harness-led feature creates a committed directory under `harness-runs/<run-id>/` containing:

- The repository-safe request.
- Summarized context and source provenance.
- The implementation plan.
- Generated acceptance scenarios.
- Deterministic check and Playwright evidence.
- A concise final report.

Run artifacts must not contain credentials, authentication headers, private conversation text, raw
MCP responses, absolute machine paths, or hidden model reasoning.
