"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressForm, type AddressFormData } from "@/components/account/address-form";
import {
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "./actions";
import type { AddressRow } from "@/db/queries/addresses";

type Props = { initialAddresses: AddressRow[] };

export function AddressesClient({ initialAddresses }: Props) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [mode, setMode] = useState<"list" | "add" | { edit: AddressRow }>("list");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(data: AddressFormData) {
    const res = await createAddressAction(data);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleUpdate(id: string, data: AddressFormData) {
    const res = await updateAddressAction(id, data);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 배송지를 삭제하시겠습니까?")) return;
    const res = await deleteAddressAction(id);
    if (res.error) {
      setError(res.error);
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSetDefault(id: string) {
    const res = await setDefaultAddressAction(id);
    if (res.error) {
      setError(res.error);
      return;
    }
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }

  if (mode === "add") {
    return (
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-bold text-wsb-carbon">새 배송지 추가</h2>
        <AddressForm
          onSubmit={handleCreate}
          onCancel={() => setMode("list")}
          submitLabel="추가"
        />
      </div>
    );
  }

  if (typeof mode === "object" && "edit" in mode) {
    const addr = mode.edit;
    return (
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-bold text-wsb-carbon">배송지 수정</h2>
        <AddressForm
          initial={{ ...addr, label: addr.label ?? undefined, address2: addr.address2 ?? undefined }}
          onSubmit={(data) => handleUpdate(addr.id, data)}
          onCancel={() => setMode("list")}
          submitLabel="저장"
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
      <button
        onClick={() => {
          setError(null);
          setMode("add");
        }}
        className="mb-6 rounded-md border border-wsb-green px-4 py-2 text-sm font-semibold text-wsb-green hover:bg-wsb-green hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
      >
        + 새 배송지 추가
      </button>
      {addresses.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-500">저장된 배송지가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((addr) => (
            <li key={addr.id} className="rounded-lg border border-stone-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {addr.label && (
                      <span className="text-xs font-semibold text-stone-500">{addr.label}</span>
                    )}
                    {addr.isDefault && (
                      <span className="rounded-full bg-wsb-green px-2 py-0.5 text-xs font-bold text-white">
                        기본
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-wsb-carbon">{addr.recipient}</p>
                  <p className="text-sm text-stone-600">{addr.phone}</p>
                  <p className="text-sm text-stone-600">
                    [{addr.zipcode}] {addr.address1}
                    {addr.address2 ? ` ${addr.address2}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      aria-label={`${addr.recipient} 배송지 기본으로 설정`}
                      className="text-xs text-wsb-green hover:underline"
                    >
                      기본으로 설정
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setError(null);
                      setMode({ edit: addr });
                    }}
                    aria-label={`${addr.recipient} 배송지 수정`}
                    className="text-xs text-stone-500 hover:underline"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    aria-label={`${addr.recipient} 배송지 삭제`}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
