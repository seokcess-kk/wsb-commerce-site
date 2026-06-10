// CSS 변수(globals.css)와 값이 일치해야 한다 — 단일 출처 역할
export const brandColors = {
  wsb: { green: "#0F5132", carbon: "#1A1F1B", lab: "#FAFBF9" },
  nutrogin: { cobalt: "#0047FF", neon: "#E8FF00", charcoal: "#111111", offwhite: "#FAFAFA" },
} as const;

// 어드민 전용 테마 토큰 — globals.css [data-admin-theme] 와 값 동기화.
export const adminColors = {
  light: {
    bg: "#F6F7F4", panel: "#FFFFFF", panel2: "#FBFCFA", line: "#E7E9E2", line2: "#EFF1EB",
    ink: "#1A201C", mut: "#6B756E", mut2: "#9AA39C",
    accent: "#177A4B", accent2: "#2FB36B", neon: "#C9D400", pos: "#2FB36B", neg: "#D9803F",
    sidebar: "#0E1A14", sidebarInk: "#9FB3A8",
  },
  dark: {
    bg: "#0B0F0D", panel: "#121A16", panel2: "#0F1512", line: "#1E2A24", line2: "#19231E",
    ink: "#E8EFEA", mut: "#7E908A", mut2: "#566159",
    accent: "#3DDC84", accent2: "#86F7B0", neon: "#E8FF00", pos: "#3DDC84", neg: "#F19B7A",
    sidebar: "#0A0F0C", sidebarInk: "#7E908A",
  },
} as const;
