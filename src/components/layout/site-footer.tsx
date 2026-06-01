export function SiteFooter() {
  return (
    <footer className="bg-wsb-carbon px-6 py-5 text-[11px] leading-7 text-stone-400">
      <p>
        <strong className="text-wsb-lab">(주)우리스마트바이오</strong> · 대표 ○○○ · 사업자등록번호 000-00-00000 ·
        통신판매업 0000-서울-0000
      </p>
      <p>
        <a href="/policy/privacy">개인정보처리방침</a> · <a href="/policy/terms">이용약관</a> ·{" "}
        <strong className="text-wsb-lab">본 제품은 질병의 예방·치료를 위한 것이 아닙니다.</strong> · 건강기능식품 표시·광고 심의필
      </p>
    </footer>
  );
}
