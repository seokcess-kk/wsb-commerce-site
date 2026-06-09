const COURIER_URL_TEMPLATES: Record<string, string> = {
  "CJ대한통운": "https://trace.cjlogistics.com/next/tracking.html?wblNo={trackingNumber}",
  "한진택배": "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2={trackingNumber}",
  "롯데택배": "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo={trackingNumber}",
  "우체국택배": "https://service.epost.go.kr/trace.RetrieveDomRightDetailw.do?sid1={trackingNumber}",
};

export function trackingUrl(
  courier: string | null,
  trackingNumber: string | null,
): string | null {
  if (!courier || !trackingNumber) return null;
  const template = COURIER_URL_TEMPLATES[courier];
  if (!template) return null;
  return template.replace("{trackingNumber}", encodeURIComponent(trackingNumber));
}
