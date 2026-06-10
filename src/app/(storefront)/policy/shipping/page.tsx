import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "배송/교환/환불 안내",
  description: "WSB 스토어 배송, 교환, 환불 안내",
};

export default function ShippingPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">배송/교환/환불 안내</h1>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">배송 안내</h2>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>배송 방법: 택배 배송</li>
        <li>기본 배송비: 3,000원</li>
        <li>50,000원 이상 구매 시 무료 배송</li>
        <li>도서·산간 지역은 추가 배송비가 발생할 수 있습니다.</li>
        <li>결제 확인 후 영업일 기준 ○일 이내 발송을 원칙으로 합니다(주말·공휴일 제외).</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">교환/반품 안내</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        상품 수령 후 7일 이내에 청약철회(반품·교환)를 신청할 수 있습니다.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        <strong>건강기능식품은 포장을 개봉하였거나 훼손되어 식품 특성상 재판매가 곤란한 경우 청약철회가
        제한될 수 있습니다</strong>(전자상거래 등에서의 소비자 보호에 관한 법률 제17조 제2항).
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        단순 변심에 의한 반품 시 왕복 배송비는 구매자가 부담합니다.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        다음 각 호에 해당하는 경우에는 반품·교환이 제한될 수 있습니다.
      </p>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>상품 수령 후 7일이 경과한 경우</li>
        <li>이용자의 귀책 사유로 상품이 훼손·오염된 경우</li>
        <li>개봉 또는 사용으로 상품 가치가 현저히 감소한 경우</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">환불 안내</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        반품 상품 도착 및 상태 확인 후 영업일 기준 ○일 이내에 결제하신 수단으로 환불 처리됩니다.
        카드 결제의 경우 카드사 정책에 따라 실제 취소 반영까지 영업일 기준 3~5일이 소요될 수 있습니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">신청 방법</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        교환·반품·환불 신청은{" "}
        <Link
          href="/support"
          className="underline"
        >
          고객지원
        </Link>{" "}
        채널을 통해 접수해 주십시오. 상품명, 주문번호, 사유를 포함하여 문의하시면 빠르게 처리해 드리겠습니다.
      </p>

      <p className="mt-12 text-xs text-stone-400">
        본 문서는 표준 템플릿이며, 시행 전 법무 검토가 필요합니다.
      </p>
    </article>
  );
}
