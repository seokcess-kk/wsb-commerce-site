export function isAdminEmail(email: string | null | undefined, adminEmailsCsv: string | undefined): boolean {
  if (!email || !adminEmailsCsv) return false;
  const allow = adminEmailsCsv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
