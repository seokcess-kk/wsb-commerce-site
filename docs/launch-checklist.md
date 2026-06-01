# WSB 종합몰 오픈 체크리스트 (목표 2026-06-30)

## 환경변수 (Vercel + .env.local)
- [ ] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / DATABASE_URL
- [ ] NEXT_PUBLIC_TOSS_CLIENT_KEY / TOSS_SECRET_KEY (운영 키로 교체)
- [ ] ADMIN_EMAILS (운영자 이메일)
- [ ] NEXT_PUBLIC_SITE_URL (실제 도메인)

## 외부 승인/계약 (리드타임 주의 — 임계경로)
- [ ] PG(토스페이먼츠) 계약·심사 완료, 운영 키 발급
- [ ] 건강기능식품판매업 신고 / 통신판매업 신고 / 구매안전(에스크로)
- [ ] 기능성 표시·광고 자율심의(건협) 통과 — 상품 카피 반영
- [ ] 사업자 정보(상호·번호·CPO 등) 정책/푸터 플레이스홀더(○○○) 교체

## 인증/소셜
- [ ] Supabase Auth: 이메일 확인 정책 설정
- [ ] Kakao / Google OAuth provider 등록 + redirect URL(<도메인>/auth/callback)
- [ ] (후속) 네이버 로그인 — 커스텀 OAuth

## 데이터/콘텐츠
- [ ] 실제 상품·옵션·재고·이미지 등록(어드민)
- [ ] 메인 배너 등록(어드민)
- [ ] 정책 3종(개인정보·약관·배송/교환/환불) 법무 검토 완료
- [ ] FAQ/연락처 실제 정보 반영

## 기능 점검 (수동)
- [ ] 카탈로그 → 상세 → 장바구니 → 결제(테스트키) → 주문완료 → 마이페이지
- [ ] 어드민: 상품 등록/수정, 주문 상태변경·송장, 배너, 대시보드
- [ ] 회원: 가입 / 로그인 / 로그아웃 / 소셜

## 기술/하드닝
- [ ] 결제 하드닝(토스 웹훅 · 원자적 재고 차감) — 실결제 전 권장
- [ ] saveProduct 서버측 입력검증(zod) — 후속
- [ ] robots.txt / sitemap.xml 확인, 네이버 서치어드바이저 · 구글 Search Console 등록
- [ ] 도메인 연결 + SSL + NEXT_PUBLIC_SITE_URL 일치

## 후속 슬라이스
- [ ] 리뷰 / 포토리뷰 · 1:1 문의
- [ ] 상품 이미지 Supabase Storage 업로드
- [ ] 회원 등급제, 정기구독(정기배송)
