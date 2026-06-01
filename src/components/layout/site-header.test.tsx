import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("WSB 로고와 효능 내비를 렌더한다", () => {
    render(<SiteHeader />);
    expect(screen.getByText("WSB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "면역" })).toBeInTheDocument();
  });
});
