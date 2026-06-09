import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listAddresses } from "@/db/queries/addresses";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const addresses = await listAddresses(user.id);
  return NextResponse.json(addresses);
}
