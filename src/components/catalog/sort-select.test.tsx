import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortSelect } from "./sort-select";

const mockReplace = vi.fn();

// next/navigation mock
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/products",
  useRouter: () => ({ replace: mockReplace }),
}));

describe("SortSelect", () => {
  it("모든 정렬 옵션을 렌더한다", () => {
    render(<SortSelect currentSort="newest" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("최신순")).toBeInTheDocument();
    expect(screen.getByText("낮은 가격순")).toBeInTheDocument();
    expect(screen.getByText("높은 가격순")).toBeInTheDocument();
    expect(screen.getByText("이름순")).toBeInTheDocument();
  });

  it("currentSort 값이 선택돼 있다", () => {
    render(<SortSelect currentSort="price_asc" />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("price_asc");
  });

  it("변경 시 router.replace 호출 (sort 파라미터 포함)", async () => {
    mockReplace.mockClear();
    render(<SortSelect currentSort="newest" />);
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "name");
    expect(mockReplace).toHaveBeenCalledWith("/products?sort=name");
  });
});
