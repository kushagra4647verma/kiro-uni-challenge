import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeverityBadge } from "@/components/SeverityBadge";
import { SEVERITY_LABEL } from "@/lib/domain/labels";

describe("SeverityBadge", () => {
  it.each([
    ["LOW", SEVERITY_LABEL.LOW],
    ["MEDIUM", SEVERITY_LABEL.MEDIUM],
    ["HIGH", SEVERITY_LABEL.HIGH],
    ["CRITICAL", SEVERITY_LABEL.CRITICAL],
  ] as const)("renders the %s severity label", (severity, label) => {
    render(<SeverityBadge severity={severity} />);

    const badge = screen.getByTestId("severity-badge");

    expect(badge).toHaveTextContent(label);
  });

  it("exposes severity through data-severity", () => {
    render(<SeverityBadge severity="CRITICAL" />);

    expect(screen.getByTestId("severity-badge")).toHaveAttribute(
      "data-severity",
      "CRITICAL",
    );
  });

  it("provides a stable test selector", () => {
    render(<SeverityBadge severity="HIGH" />);

    expect(screen.getByTestId("severity-badge")).toBeInTheDocument();
  });

  it("supports a custom className", () => {
    render(
      <SeverityBadge
        severity="MEDIUM"
        className="custom-severity-class"
      />,
    );

    expect(screen.getByTestId("severity-badge")).toHaveClass(
      "custom-severity-class",
    );
  });
});