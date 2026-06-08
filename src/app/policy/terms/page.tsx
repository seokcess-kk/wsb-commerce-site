import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "WSB 스토어 이용약관",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">이용약관</h1>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제1조 목적</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        이 약관은 (주)우리스마트바이오(이하 “회사”)가 운영하는 WSB 스토어(이하 “쇼핑몰”)에서
        제공하는 인터넷 관련 서비스(이하 “서비스”)의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제2조 정의</h2>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>“쇼핑몰”이란 회사가 재화 및 용역을 이용자에게 제공하기 위하여 운영하는 가상의 영업장을 말합니다.</li>
        <li>“이용자”란 쇼핑몰에 접속하여 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
        <li>“회원”이란 쇼핑몰에 회원가입을 한 자로서, 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를 말합니다.</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제3조 약관의 효력 및 변경</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        이 약관은 쇼핑몰 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
        회사는 합리적인 사유가 있을 경우 관련 법령에 위배되지 않는 범위 내에서 이 약관을 변경할 수 있으며,
        변경된 약관은 시행일 7일 전부터 공지합니다. 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을
        중단하고 탈퇴할 수 있습니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제4조 회원가입</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회원가입은 이용자가 약관에 동의하고 회원가입 신청을 하면, 회사가 이를 승낙함으로써 체결됩니다.
        만 14세 미만자는 원칙적으로 회원가입이 제한됩니다. 회사는 다음 각 호의 경우 회원가입 신청을
        거절하거나 사후에 이용 계약을 해지할 수 있습니다.
      </p>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>타인의 정보를 도용한 경우</li>
        <li>허위 정보를 기재한 경우</li>
        <li>기타 이 약관 또는 관련 법령을 위반한 경우</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제5조 서비스 이용</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
        단, 시스템 점검, 장비 교체, 서비스 개선 등 운영상의 이유로 서비스가 일시 중단될 수 있으며,
        이 경우 사전에 공지합니다. 부득이한 경우 사후에 공지할 수 있습니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제6조 주문 및 계약의 성립</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        이용자는 쇼핑몰에서 다음 절차로 구매를 신청합니다: 상품 선택 → 주문 정보 입력 → 약관 동의 →
        결제. 회사가 이용자의 주문에 대해 결제 완료 확인을 통지한 시점에 계약이 성립합니다.
        재고 부족 등 사유로 계약 이행이 불가한 경우 회사는 이용자에게 통보하고 환불 조치합니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제7조 결제</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        쇼핑몰에서 구매한 재화의 대금 지급 방법은 신용카드, 체크카드, 간편결제 등 PG사(토스페이먼츠)가
        지원하는 수단으로 할 수 있습니다. 결제 과정에서 발생하는 개인정보는 PG사의 정책에 따라 처리됩니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">
        제8조 청약철회·반품·교환
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        이용자는 상품 수령 후 7일 이내에 청약철회를 신청할 수 있습니다(전자상거래 등에서의 소비자 보호에
        관한 법률 제17조). 단, 다음 각 호에 해당하는 경우에는 청약철회가 제한될 수 있습니다.
      </p>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>건강기능식품으로서 포장을 개봉하였거나 훼손되어 식품 특성상 재판매가 곤란한 경우</li>
        <li>이용자의 사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우</li>
        <li>시간이 지남에 따라 재판매가 곤란할 정도로 상품 가치가 감소한 경우</li>
      </ul>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        단순 변심에 의한 반품 시 왕복 배송비는 구매자가 부담합니다.
        자세한 내용은 <a href="/policy/shipping" className="underline">배송/교환/환불 안내</a>를 참조하십시오.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">제9조 면책</h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력으로 인해 서비스를 제공할 수 없는
        경우 책임을 면합니다. 이용자가 자신의 귀책 사유로 인해 발생한 손해에 대하여 회사는 책임을 지지 않습니다.
        회사는 이용자 상호 간 또는 이용자와 제3자 간에 서비스를 통해 발생한 분쟁에 개입할 의무가 없습니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-wsb-carbon">
        제10조 분쟁해결 및 준거법·관할
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        이 약관과 관련된 분쟁에는 대한민국 법률이 적용됩니다. 회사와 이용자 간 발생한 분쟁에 대해 소송이
        제기될 경우 민사소송법상의 관할 법원에 제소합니다. 소비자 분쟁과 관련하여서는
        공정거래위원회의 소비자분쟁해결기준에 따릅니다. 회사의 상호 및 연락처: (주)우리스마트바이오 / ○○○.
      </p>

      <p className="mt-12 text-xs text-stone-400">
        본 문서는 표준 템플릿이며, 시행 전 법무 검토가 필요합니다.
      </p>
    </article>
  );
}
