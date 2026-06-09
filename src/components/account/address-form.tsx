"use client";

import { useState } from "react";
import { PostcodeSearch } from "@/components/checkout/postcode-search";

export type AddressFormData = {
  label?: string;
  recipient: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2?: string;
  isDefault: boolean;
};

type Props = {
  initial?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
};

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2";
const inputCls = `w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`;
const readonlyCls =
  "w-full rounded-md border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500 cursor-not-allowed";

export function AddressForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "저장",
}: Props) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [recipient, setRecipient] = useState(initial?.recipient ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [zipcode, setZipcode] = useState(initial?.zipcode ?? "");
  const [address1, setAddress1] = useState(initial?.address1 ?? "");
  const [address2, setAddress2] = useState(initial?.address2 ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePostcode(result: { zipcode: string; address1: string }) {
    setZipcode(result.zipcode);
    setAddress1(result.address1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!recipient.trim()) return setError("수령인을 입력해 주세요.");
    if (!phone.trim()) return setError("연락처를 입력해 주세요.");
    if (!zipcode) return setError("주소를 검색해 주세요.");
    setLoading(true);
    try {
      await onSubmit({
        label: label || undefined,
        recipient,
        phone,
        zipcode,
        address1,
        address2: address2 || undefined,
        isDefault,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className="mb-1 block text-sm font-semibold text-wsb-carbon"
          htmlFor="af-label"
        >
          레이블 (선택)
        </label>
        <input
          id="af-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 집, 회사"
          className={inputCls}
        />
      </div>
      <div>
        <label
          className="mb-1 block text-sm font-semibold text-wsb-carbon"
          htmlFor="af-recipient"
        >
          수령인 *
        </label>
        <input
          id="af-recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          className={inputCls}
        />
      </div>
      <div>
        <label
          className="mb-1 block text-sm font-semibold text-wsb-carbon"
          htmlFor="af-phone"
        >
          연락처 *
        </label>
        <input
          id="af-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className={inputCls}
        />
      </div>
      <div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label
              className="mb-1 block text-sm font-semibold text-wsb-carbon"
              htmlFor="af-zipcode"
            >
              우편번호
            </label>
            <input
              id="af-zipcode"
              type="text"
              value={zipcode}
              readOnly
              className={readonlyCls}
            />
          </div>
          <PostcodeSearch onComplete={handlePostcode} />
        </div>
      </div>
      <div>
        <label
          className="mb-1 block text-sm font-semibold text-wsb-carbon"
          htmlFor="af-address1"
        >
          기본 주소
        </label>
        <input
          id="af-address1"
          type="text"
          value={address1}
          readOnly
          className={readonlyCls}
        />
      </div>
      <div>
        <label
          className="mb-1 block text-sm font-semibold text-wsb-carbon"
          htmlFor="af-address2"
        >
          상세 주소
        </label>
        <input
          id="af-address2"
          type="text"
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
          placeholder="동, 호수 등"
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="af-isdefault"
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-wsb-green"
        />
        <label htmlFor="af-isdefault" className="text-sm text-wsb-carbon">
          기본 배송지로 설정
        </label>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 rounded-md bg-wsb-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${ring}`}
        >
          {loading ? "저장 중…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 rounded-md border border-stone-300 px-5 py-2.5 text-sm font-semibold text-wsb-carbon ${ring}`}
        >
          취소
        </button>
      </div>
    </form>
  );
}
