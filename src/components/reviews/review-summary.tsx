import { getRatingSummary } from "@/db/queries/reviews";
import { StarRating } from "./star-rating";

export async function ReviewSummary({ productId }: { productId: string }) {
  const { count, average } = await getRatingSummary(productId);

  if (count === 0) {
    return (
      <p className="text-sm text-stone-400">아직 리뷰가 없습니다</p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(average)} size={18} />
      <span className="text-sm font-semibold text-wsb-carbon">
        {average.toFixed(1)}
      </span>
      <span className="text-sm text-stone-500">({count}개 리뷰)</span>
    </div>
  );
}
