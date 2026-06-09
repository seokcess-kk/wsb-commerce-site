// 택배사 추적 링크. 운영자가 입력한 자유 텍스트 courier 를 키워드로 매칭한다.

type CarrierDef = {
  label: string;
  // courier 입력에서 이 키워드들 중 하나라도 포함되면 매칭(소문자·공백제거 비교).
  match: string[];
  url: (trackingNumber: string) => string;
};

const CARRIERS: CarrierDef[] = [
  {
    label: "CJ대한통운",
    match: ["cj", "대한통운", "cjlogistics"],
    url: (n) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${n}`,
  },
  {
    label: "한진택배",
    match: ["한진", "hanjin"],
    url: (n) =>
      `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${n}`,
  },
  {
    label: "우체국택배",
    match: ["우체국", "epost"],
    url: (n) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}`,
  },
  {
    label: "롯데택배",
    match: ["롯데", "lotte"],
    url: (n) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${n}`,
  },
  {
    label: "로젠택배",
    match: ["로젠", "logen", "ilogen"],
    url: (n) => `https://www.ilogen.com/web/personal/trace/${n}`,
  },
];

export const SUPPORTED_COURIERS: string[] = CARRIERS.map((c) => c.label);

export function trackingUrl(
  courier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  const num = (trackingNumber ?? "").trim();
  if (!num) return null;
  const key = (courier ?? "").toLowerCase().replace(/\s/g, "");
  if (!key) return null;

  for (const c of CARRIERS) {
    if (c.match.some((m) => key.includes(m.toLowerCase().replace(/\s/g, "")))) {
      return c.url(num);
    }
  }
  return null;
}
