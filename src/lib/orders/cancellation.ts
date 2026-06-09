export type RequestType = "cancel" | "exchange" | "return";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  cancel: "취소",
  exchange: "교환",
  return: "반품",
};

export function availableRequestTypes(status: string): RequestType[] {
  if (status === "paid" || status === "preparing") {
    return ["cancel"];
  }
  if (status === "shipped" || status === "delivered") {
    return ["exchange", "return"];
  }
  return [];
}
