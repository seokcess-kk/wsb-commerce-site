"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CheckoutAddress } from "@/lib/account/address-types";

type SavedAddress = {
  id: string;
  label: string | null;
  recipient: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2: string | null;
  isDefault: boolean;
};

type FetchState =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "loaded"; addresses: SavedAddress[] };

export function AddressSelector({ onSelect }: { onSelect: (a: CheckoutAddress) => void }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/addresses")
      .then(async (r) => {
        if (r.status === 401) {
          setState({ status: "unauthorized" });
          return;
        }
        if (!r.ok) {
          setState({ status: "loaded", addresses: [] });
          return;
        }
        const data: SavedAddress[] = await r.json();
        setState({ status: "loaded", addresses: data });
      })
      .catch(() => setState({ status: "loaded", addresses: [] }));
  }, []);

  if (state.status === "loading") {
    return <p className="text-sm text-stone-400">배송지 불러오는 중…</p>;
  }

  if (state.status === "unauthorized") {
    return (
      <p className="text-sm text-stone-400">
        <Link href="/login" className="underline hover:text-wsb-green">
          로그인
        </Link>
        하면 저장된 배송지를 사용할 수 있어요
      </p>
    );
  }

  if (state.addresses.length === 0) {
    return <p className="text-sm text-stone-400">저장된 배송지 없음</p>;
  }

  return (
    <ul className="space-y-2">
      {state.addresses.map((addr) => (
        <li key={addr.id}>
          <button
            type="button"
            onClick={() =>
              onSelect({
                recipient: addr.recipient,
                phone: addr.phone,
                zipcode: addr.zipcode,
                address1: addr.address1,
                address2: addr.address2,
              })
            }
            className="w-full rounded-md border border-stone-200 px-4 py-3 text-left hover:border-wsb-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-1"
          >
            <div className="flex items-center gap-2">
              {addr.label && (
                <span className="text-xs text-stone-500">{addr.label}</span>
              )}
              {addr.isDefault && (
                <span className="rounded-full bg-wsb-green px-2 py-0.5 text-xs font-bold text-white">
                  기본
                </span>
              )}
            </div>
            <p className="mt-0.5 font-semibold text-wsb-carbon">{addr.recipient}</p>
            <p className="text-sm text-stone-600">{addr.phone}</p>
            <p className="text-sm text-stone-500">
              [{addr.zipcode}] {addr.address1}
              {addr.address2 ? ` ${addr.address2}` : ""}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
