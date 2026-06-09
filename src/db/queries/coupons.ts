import { eq, and, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { validateCoupon } from "@/lib/coupons/validate";
import { couponDiscount } from "@/lib/checkout/discount";
import { couponRowToRule } from "@/lib/checkout/coupon-order";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CouponRow = typeof schema.coupons.$inferSelect;
export type UserCouponRow = typeof schema.userCoupons.$inferSelect;

export type UserCouponWithDetails = {
  userCouponId: string;
  usedAt: Date | null;
  orderId: string | null;
  coupon: CouponRow;
};

export type ApplyCouponResult =
  | { ok: true; discount: number; code: string }
  | { ok: false; reason: string };

export type ClaimCouponResult =
  | { ok: true }
  | { ok: false; reason: string };

// ── Queries ───────────────────────────────────────────────────────────────────

/** Find a coupon by its code. Returns null if not found. */
export async function findCouponByCode(code: string): Promise<CouponRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.coupons)
    .where(eq(schema.coupons.code, code.trim().toUpperCase()))
    .limit(1);
  return row ?? null;
}

/**
 * Claim a coupon for a user.
 * - Finds the coupon by code; returns error if missing or inactive.
 * - Inserts into userCoupons with onConflictDoNothing; if the result set is
 *   empty the unique(couponId, userId) constraint was triggered — return a
 *   friendly duplicate message. No try/catch needed: onConflictDoNothing
 *   suppresses the unique violation so no exception is thrown.
 */
export async function claimCoupon(
  userId: string,
  code: string,
): Promise<ClaimCouponResult> {
  const db = getDb();

  const coupon = await findCouponByCode(code);
  if (!coupon) return { ok: false, reason: "존재하지 않는 쿠폰 코드입니다." };
  if (!coupon.isActive) return { ok: false, reason: "사용할 수 없는 쿠폰입니다." };

  const result = await db
    .insert(schema.userCoupons)
    .values({ couponId: coupon.id, userId })
    .onConflictDoNothing()
    .returning({ id: schema.userCoupons.id });

  if (result.length === 0) {
    return { ok: false, reason: "이미 등록된 쿠폰입니다." };
  }
  return { ok: true };
}

/**
 * List all claimed coupons for a user, joined with coupon details.
 * Results include both used and available coupons.
 */
export async function listUserCoupons(userId: string): Promise<UserCouponWithDetails[]> {
  const db = getDb();

  const rows = await db
    .select({
      userCouponId: schema.userCoupons.id,
      usedAt: schema.userCoupons.usedAt,
      orderId: schema.userCoupons.orderId,
      coupon: schema.coupons,
    })
    .from(schema.userCoupons)
    .innerJoin(schema.coupons, eq(schema.userCoupons.couponId, schema.coupons.id))
    .where(eq(schema.userCoupons.userId, userId))
    .orderBy(schema.userCoupons.createdAt);

  return rows.map((r) => ({
    userCouponId: r.userCouponId,
    usedAt: r.usedAt,
    orderId: r.orderId,
    coupon: r.coupon,
  }));
}

/**
 * For checkout: verify the user has claimed this coupon, it's unused,
 * and validateCoupon passes. Returns discount amount on success.
 */
export async function getApplicableCoupon(
  userId: string,
  code: string,
  subtotal: number,
  now: Date,
): Promise<ApplyCouponResult> {
  const db = getDb();

  const coupon = await findCouponByCode(code);
  if (!coupon) return { ok: false, reason: "존재하지 않는 쿠폰 코드입니다." };

  // Check user has claimed this coupon and it's unused
  const [userCoupon] = await db
    .select()
    .from(schema.userCoupons)
    .where(
      and(
        eq(schema.userCoupons.userId, userId),
        eq(schema.userCoupons.couponId, coupon.id),
        isNull(schema.userCoupons.usedAt),
      ),
    )
    .limit(1);

  if (!userCoupon) {
    // Distinguish between "not claimed" and "already used"
    const [anyClaim] = await db
      .select({ id: schema.userCoupons.id })
      .from(schema.userCoupons)
      .where(
        and(
          eq(schema.userCoupons.userId, userId),
          eq(schema.userCoupons.couponId, coupon.id),
        ),
      )
      .limit(1);

    if (anyClaim) {
      return { ok: false, reason: "이미 사용된 쿠폰입니다." };
    }
    return { ok: false, reason: "보유하지 않은 쿠폰입니다." };
  }

  // Validate date window and min subtotal
  const validation = validateCoupon(coupon, now, subtotal);
  if (!validation.ok) return { ok: false, reason: validation.reason };

  const rule = couponRowToRule(coupon);
  const discount = couponDiscount(subtotal, rule);

  return { ok: true, discount, code: coupon.code };
}

/**
 * Mark a user's coupon as used after an order is placed.
 * Called by Phase 2 payment flow; no-op if already used.
 */
export async function markCouponUsed(
  userId: string,
  code: string,
  orderId: string,
): Promise<void> {
  const db = getDb();

  const coupon = await findCouponByCode(code);
  if (!coupon) return;

  await db
    .update(schema.userCoupons)
    .set({ usedAt: new Date(), orderId })
    .where(
      and(
        eq(schema.userCoupons.userId, userId),
        eq(schema.userCoupons.couponId, coupon.id),
        isNull(schema.userCoupons.usedAt),
      ),
    );
}
