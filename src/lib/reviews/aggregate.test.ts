import { describe, it, expect } from "vitest";
import { aggregateRatings } from "./aggregate";

describe("aggregateRatings", () => {
  it("빈 배열은 0/0", () => expect(aggregateRatings([])).toEqual({ count: 0, average: 0 }));
  it("평균은 소수 1자리 반올림", () => expect(aggregateRatings([5, 4, 4])).toEqual({ count: 3, average: 4.3 }));
});
