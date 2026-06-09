import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StarRating } from "./star-rating";

describe("StarRating — display mode", () => {
  it("value=3 이면 SVG 5개를 렌더한다", () => {
    const { container } = render(<StarRating value={3} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(5);
  });

  it("value=4 이면 채워진 별 4개, 빈 별 1개", () => {
    const { container } = render(<StarRating value={4} />);
    const svgs = Array.from(container.querySelectorAll("svg"));
    const filled = svgs.filter((s) => s.getAttribute("fill") === "#F59E0B");
    const empty = svgs.filter((s) => s.getAttribute("fill") === "none");
    expect(filled).toHaveLength(4);
    expect(empty).toHaveLength(1);
  });

  it("onChange 없으면 버튼이 없다", () => {
    render(<StarRating value={2} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("StarRating — input mode", () => {
  it("onChange 제공 시 5개 버튼을 렌더한다", () => {
    render(<StarRating value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("각 버튼은 'N점' aria-label을 가진다", () => {
    render(<StarRating value={0} onChange={vi.fn()} />);
    for (let n = 1; n <= 5; n++) {
      expect(screen.getByRole("button", { name: `${n}점` })).toBeInTheDocument();
    }
  });

  it("별 클릭 시 해당 값으로 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "3점" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("별 클릭 시 정확한 값을 전달한다 (value=5)", async () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "5점" }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("Enter 키를 누르면 해당 별의 값으로 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    const btn = screen.getByRole("button", { name: "4점" });
    await userEvent.type(btn, "{enter}");
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("Space 키를 누르면 해당 별의 값으로 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    const btn = screen.getByRole("button", { name: "2점" });
    await userEvent.type(btn, " ");
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
