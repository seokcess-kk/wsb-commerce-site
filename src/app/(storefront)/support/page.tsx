import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "고객지원",
  description: "WSB 스토어 고객지원 — 자주 묻는 질문과 문의 안내.",
};

const faqs = [
  {
    q: "주문 확인은 어디서 하나요?",
    a: "로그인 후 마이페이지 > 주문 내역에서 주문 현황을 확인하실 수 있습니다. 비회원으로 주문하신 경우에도 주문 시 입력한 이메일 주소와 주문번호로 조회가 가능합니다.",
  },
  {
    q: "어떤 결제 수단을 지원하나요?",
    a: "신용카드·체크카드, 카카오페이·네이버페이 등 간편결제, 계좌이체를 지원합니다. 결제는 토스페이먼츠(Toss Payments)를 통해 안전하게 처리됩니다.",
  },
  {
    q: "배송비와 무료배송 기준은?",
    a: null,
    aNode: (
      <>
        기본 배송비는 3,000원이며, 주문 금액 50,000원 이상 시 무료 배송이 적용됩니다.
        자세한 배송 안내는{" "}
        <Link
          href="/policy/shipping"
          className="underline underline-offset-2 hover:text-ng-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt rounded-sm"
        >
          배송/교환/환불 안내
        </Link>
        를 확인해 주세요.
      </>
    ),
  },
  {
    q: "교환/반품은 어떻게 하나요?",
    a: null,
    aNode: (
      <>
        상품 수령 후 7일 이내에 고객지원 채널로 신청하실 수 있습니다. 단,{" "}
        <strong>건강기능식품은 포장을 개봉하였거나 훼손된 경우 청약철회가 제한될 수 있습니다.</strong>{" "}
        자세한 내용은{" "}
        <Link
          href="/policy/shipping"
          className="underline underline-offset-2 hover:text-ng-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt rounded-sm"
        >
          배송/교환/환불 안내
        </Link>
        를 참고해 주세요.
      </>
    ),
  },
  {
    q: "건강기능식품은 어떻게 섭취하나요?",
    a: "각 상품 상세페이지의 섭취 방법 및 주의사항을 반드시 확인하신 후 섭취해 주세요. 본 제품은 질병의 예방 또는 치료를 위한 의약품이 아닙니다.",
  },
  {
    q: "회원가입/로그인은 어떻게 하나요?",
    a: "이메일 주소로 직접 가입하시거나, 카카오 또는 구글 소셜 로그인을 이용하실 수 있습니다.",
  },
  {
    q: "원료는 어떻게 관리되나요?",
    a: "스마트팜에서 표준화한 식물 원료를 사용하며, 진세노사이드 등 지표성분을 정량 관리합니다. 제품별 원료와 함량은 각 상품 상세페이지에서 확인하실 수 있습니다.",
  },
  {
    q: "보관은 어떻게 하나요?",
    a: "직사광선을 피해 서늘하고 건조한 곳에 보관해 주세요. 개봉 후에는 가급적 빠른 시일 내에 섭취하시는 것을 권장합니다.",
  },
  {
    q: "임산부이거나 약을 복용 중인데 먹어도 되나요?",
    a: "임산부·수유부, 질환이 있거나 약을 복용 중이신 경우 섭취 전 전문가와 상담하시기 바랍니다. 제품별 섭취 시 주의사항은 상세페이지를 확인해 주세요.",
  },
];

export default function SupportPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-extrabold text-ng-charcoal">고객지원</h1>

      {/* 연락처/운영시간 */}
      <div className="mt-8 rounded-lg border border-stone-200 bg-stone-50 px-6 py-5">
        <h2 className="text-base font-bold text-ng-charcoal">연락처 및 운영시간</h2>
        <dl className="mt-3 space-y-2 text-sm text-stone-600">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="font-semibold text-ng-charcoal sm:w-24 sm:shrink-0">문의</dt>
            <dd>
              <Link
                href="/support/inquiry"
                className="font-semibold text-ng-cobalt underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt rounded-sm"
              >
                1:1 문의하기
              </Link>{" "}
              로 접수해 주세요.
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <dt className="font-semibold text-ng-charcoal sm:w-24 sm:shrink-0">운영시간</dt>
            <dd>평일 10:00 ~ 17:00 (주말·공휴일 휴무)</dd>
          </div>
        </dl>
      </div>

      {/* FAQ */}
      <h2 className="mt-10 text-base font-bold text-ng-charcoal">자주 묻는 질문</h2>
      <div className="mt-3">
        {faqs.map((faq) => (
          <details key={faq.q} className="border-b border-stone-200 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-ng-charcoal">
              {faq.q}
            </summary>
            <div className="mt-2 text-sm leading-relaxed text-stone-600">
              {faq.aNode ?? faq.a}
            </div>
          </details>
        ))}
      </div>

      {/* 1:1 문의 */}
      <div className="mt-10 rounded-lg border border-ng-cobalt/20 bg-ng-cobalt/5 px-6 py-5">
        <h2 className="text-base font-bold text-ng-charcoal">1:1 문의</h2>
        <p className="mt-1 text-sm text-stone-600">
          FAQ에서 해결되지 않은 문의는 1:1 문의를 이용해 주세요. 평일 10:00~17:00 내 순차 답변합니다.
        </p>
        <Link
          href="/support/inquiry"
          className="mt-3 inline-block rounded-md bg-ng-cobalt px-5 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt focus-visible:ring-offset-2"
        >
          문의하기
        </Link>
      </div>

      {/* 정책 바로가기 */}
      <h2 className="mt-10 text-base font-bold text-ng-charcoal">정책 바로가기</h2>
      <ul className="mt-3 space-y-2 text-sm">
        <li>
          <Link
            href="/policy/privacy"
            className="text-ng-charcoal underline underline-offset-2 hover:text-ng-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt rounded-sm"
          >
            개인정보처리방침
          </Link>
        </li>
        <li>
          <Link
            href="/policy/terms"
            className="text-ng-charcoal underline underline-offset-2 hover:text-ng-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt rounded-sm"
          >
            이용약관
          </Link>
        </li>
        <li>
          <Link
            href="/policy/shipping"
            className="text-ng-charcoal underline underline-offset-2 hover:text-ng-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt rounded-sm"
          >
            배송/교환/환불 안내
          </Link>
        </li>
      </ul>
    </section>
  );
}
