import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "WSB 스토어 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-extrabold text-ng-charcoal">개인정보처리방침</h1>

      <p className="mt-4 text-sm leading-relaxed text-stone-600">
        (주)우리스마트바이오(이하 “회사”)는 개인정보 보호법 및 관련 법령에 따라 이용자의 개인정보를
        보호하고 이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제1조 수집하는 개인정보 항목
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회사는 서비스 제공을 위해 아래의 개인정보를 수집합니다.
      </p>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>
          <strong>회원가입 시:</strong> 이메일 주소, 비밀번호(암호화 저장)
        </li>
        <li>
          <strong>주문·배송 시:</strong> 성명, 연락처(휴대폰 번호), 이메일 주소, 배송지 주소
        </li>
        <li>
          <strong>결제 정보:</strong> 결제는 PG사(토스페이먼츠)를 통해 처리되며, 회사는 카드번호 등 결제 원본 정보를
          보관하지 않습니다.
        </li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제2조 개인정보의 수집·이용 목적
      </h2>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>회원 식별 및 회원관리</li>
        <li>주문 접수, 결제 확인, 배송 처리 및 배송 현황 안내</li>
        <li>고객 문의 및 불만 접수·처리</li>
        <li>전자상거래법 등 관련 법령상 의무 이행</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제3조 개인정보의 보유 및 이용 기간
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회원 탈퇴 또는 개인정보 수집·이용 목적 달성 시 지체 없이 파기합니다.
        단, 전자상거래 등에서의 소비자 보호에 관한 법률에 따라 아래 정보는 해당 기간 동안 보관합니다.
      </p>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>계약 또는 청약철회에 관한 기록: 5년</li>
        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
        <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제4조 개인정보의 제3자 제공
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
        다만, 배송 업무를 위해 택배사에 수령인의 성명, 연락처, 배송지 주소 등 최소한의 정보를 제공합니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제5조 개인정보 처리위탁
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회사는 서비스 제공에 필요한 업무를 아래와 같이 위탁하고 있습니다.
      </p>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>결제 처리: 토스페이먼츠(주)</li>
        <li>배송 처리: 위탁 택배사(○○○)</li>
        <li>서비스 인프라 운영: Supabase, Vercel</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제6조 정보주체의 권리
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다.
        요청은 하단의 개인정보 보호책임자에게 서면, 이메일 등의 방법으로 할 수 있으며, 회사는 지체 없이
        조치합니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제7조 만 14세 미만 아동
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회사는 원칙적으로 만 14세 미만 아동의 회원가입을 제한합니다.
        부득이하게 만 14세 미만 아동의 개인정보를 수집하는 경우에는 법정대리인의 동의를 받습니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제8조 쿠키(Cookie) 사용
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회사는 로그인 세션 유지 등을 목적으로 쿠키를 사용합니다. 이용자는 웹 브라우저의 설정을 변경하여
        쿠키 저장을 거부하거나 삭제할 수 있습니다. 단, 쿠키를 거부할 경우 일부 서비스 이용에 제한이
        있을 수 있습니다.
      </p>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제9조 개인정보 보호책임자(CPO)
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        이용자의 개인정보 관련 문의, 불만 처리, 피해 구제 등을 담당하는 개인정보 보호책임자는 다음과 같습니다.
      </p>
      <ul className="list-disc pl-5 text-sm leading-relaxed text-stone-600">
        <li>성명: ○○○</li>
        <li>연락처: ○○○</li>
      </ul>

      <h2 className="mb-2 mt-8 text-base font-bold text-ng-charcoal">
        제10조 개인정보의 파기 절차 및 방법
      </h2>
      <p className="text-sm leading-relaxed text-stone-600">
        회사는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 해당 개인정보를 지체 없이 파기합니다.
        전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제하며, 출력물 등은 분쇄기로 분쇄하거나
        소각합니다.
      </p>

      <p className="mt-12 text-xs text-stone-400">
        본 문서는 표준 템플릿이며, 시행 전 법무 검토가 필요합니다.
      </p>
    </article>
  );
}
