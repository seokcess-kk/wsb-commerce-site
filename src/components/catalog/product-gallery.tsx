"use client";
import { useState } from "react";
import Image from "next/image";

function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export function ProductGallery({
  images,
  fallbackLabel,
  isNutrogin = false,
}: {
  images: string[];
  fallbackLabel: string;
  isNutrogin?: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 0) {
    const zone = isNutrogin
      ? "bg-ng-cobalt text-white border-t-2 border-ng-neon"
      : "bg-stone-100 text-stone-400";
    return (
      <div
        className={`flex min-h-80 items-center justify-center rounded-lg ${zone}`}
      >
        <span
          className={`font-mono text-sm${isNutrogin ? " text-ng-neon" : ""}`}
        >
          {fallbackLabel}
        </span>
      </div>
    );
  }

  const mainSrc = images[activeIdx] ?? images[0];
  const external = isExternalUrl(mainSrc);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative min-h-80 w-full overflow-hidden rounded-lg bg-stone-100">
        <Image
          src={mainSrc}
          alt={`${fallbackLabel} 메인 이미지`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          unoptimized={external}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, idx) => {
            const ext = isExternalUrl(src);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                aria-label={`${fallbackLabel} 이미지 ${idx + 1}`}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  idx === activeIdx
                    ? "border-ng-cobalt"
                    : "border-stone-200 hover:border-ng-cobalt/50"
                }`}
              >
                <Image
                  src={src}
                  alt={`${fallbackLabel} 썸네일 ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={ext}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
