"use client";

export type StarRatingProps = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === "function";

  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value}점`}
      role={interactive ? undefined : "img"}
    >
      {stars.map((n) => {
        const filled = n <= value;
        if (interactive) {
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n}점`}
              onClick={() => onChange(n)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(n);
                }
              }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ng-cobalt rounded-sm"
            >
              <StarIcon filled={filled} size={size} />
            </button>
          );
        }
        return <StarIcon key={n} filled={filled} size={size} />;
      })}
    </span>
  );
}

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={filled ? "#F59E0B" : "none"}
      stroke={filled ? "#F59E0B" : "#D1D5DB"}
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
    </svg>
  );
}
