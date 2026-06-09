import { getCurrentUser } from "@/lib/auth/current-user";
import { listAddresses } from "@/db/queries/addresses";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json([], { status: 200 });
  const addresses = await listAddresses(user.id);
  return Response.json(addresses);
}
