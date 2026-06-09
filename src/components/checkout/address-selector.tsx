"use client";
import type { CheckoutAddress } from "@/lib/account/address-types";
export function AddressSelector({ onSelect }: { onSelect: (a: CheckoutAddress) => void }) {
  void onSelect;
  return <div className="text-sm text-stone-400">배송지 불러오기 준비중</div>;
}
