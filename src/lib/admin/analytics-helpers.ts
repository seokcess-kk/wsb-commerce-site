export function summarizeCustomers(rows: { userId: string; orderCount: number }[]) {
  const total = rows.length;
  const repeat = rows.filter((r) => r.orderCount >= 2).length;
  return { total, repeat, newCustomers: total - repeat, repeatRate: total ? Math.round((repeat / total) * 100) : 0 };
}
