"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressInsert,
} from "@/db/queries/addresses";

async function getAuthUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/addresses");
  return user;
}

export async function listAddressesAction() {
  const user = await getAuthUser();
  return listAddresses(user.id);
}

export async function createAddressAction(data: AddressInsert): Promise<{ error?: string }> {
  const user = await getAuthUser();
  await createAddress(user.id, data);
  revalidatePath("/account/addresses");
  return {};
}

export async function updateAddressAction(
  id: string,
  data: Partial<AddressInsert>,
): Promise<{ error?: string }> {
  const user = await getAuthUser();
  const result = await updateAddress(user.id, id, data);
  if (!result) return { error: "주소를 찾을 수 없습니다." };
  revalidatePath("/account/addresses");
  return {};
}

export async function deleteAddressAction(id: string): Promise<{ error?: string }> {
  const user = await getAuthUser();
  await deleteAddress(user.id, id);
  revalidatePath("/account/addresses");
  return {};
}

export async function setDefaultAddressAction(id: string): Promise<{ error?: string }> {
  const user = await getAuthUser();
  await setDefaultAddress(user.id, id);
  revalidatePath("/account/addresses");
  return {};
}
