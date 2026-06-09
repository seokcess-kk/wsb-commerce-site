"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toggleWishlist } from "@/db/queries/wishlists";

export async function toggleWishlistAction(productId: string): Promise<{ active: boolean }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const active = await toggleWishlist(user.id, productId);
  revalidatePath("/account/wishlist");
  return { active };
}
