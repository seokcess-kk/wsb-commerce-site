import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type AddressRow = typeof schema.addresses.$inferSelect;
export type AddressInsert = Omit<typeof schema.addresses.$inferInsert, "id" | "userId" | "createdAt">;

export async function listAddresses(userId: string): Promise<AddressRow[]> {
  const db = getDb();
  return db
    .select()
    .from(schema.addresses)
    .where(eq(schema.addresses.userId, userId))
    .orderBy(schema.addresses.createdAt);
}

export async function getAddress(userId: string, id: string): Promise<AddressRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.addresses)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createAddress(userId: string, data: AddressInsert): Promise<AddressRow> {
  const db = getDb();
  if (data.isDefault) {
    // Single default: clear others in a transaction
    const [created] = await db.transaction(async (tx) => {
      await tx
        .update(schema.addresses)
        .set({ isDefault: false })
        .where(eq(schema.addresses.userId, userId));
      return tx
        .insert(schema.addresses)
        .values({ ...data, userId })
        .returning();
    });
    return created;
  }
  const [created] = await db
    .insert(schema.addresses)
    .values({ ...data, userId })
    .returning();
  return created;
}

export async function updateAddress(
  userId: string,
  id: string,
  data: Partial<AddressInsert>,
): Promise<AddressRow | null> {
  const db = getDb();
  if (data.isDefault) {
    const [updated] = await db.transaction(async (tx) => {
      await tx
        .update(schema.addresses)
        .set({ isDefault: false })
        .where(eq(schema.addresses.userId, userId));
      return tx
        .update(schema.addresses)
        .set(data)
        .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)))
        .returning();
    });
    return updated ?? null;
  }
  const [updated] = await db
    .update(schema.addresses)
    .set(data)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const db = getDb();
  await db
    .delete(schema.addresses)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)));
}

export async function setDefaultAddress(userId: string, id: string): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.addresses)
      .set({ isDefault: false })
      .where(eq(schema.addresses.userId, userId));
    await tx
      .update(schema.addresses)
      .set({ isDefault: true })
      .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)));
  });
}
