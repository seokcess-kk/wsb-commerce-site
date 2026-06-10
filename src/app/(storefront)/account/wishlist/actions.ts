"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toggleWishlist } from "@/db/queries/wishlists";

export async function toggleWishlistAction(
  productId: string,
): Promise<{ active: boolean } | { unauthorized: true }> {
  const user = await getCurrentUser();
  if (!user) return { unauthorized: true };

  const active = await toggleWishlist(user.id, productId);
  revalidatePath("/account/wishlist");
  return { active };
}
