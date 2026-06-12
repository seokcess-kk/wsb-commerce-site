import { FAQ } from "@/lib/brand/copy";
import { SectionHeading } from "@/components/ui/section-heading";
import { FaqAccordion } from "@/components/ui/faq-accordion";

// FAQ — 섭취/타이밍/배송/교환반품/보관/대상. 공유 FaqAccordion 사용.
export function HomeFaq() {
  return (
    <section className="bg-ng-offwhite px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="자주 묻는 질문" />
        <div className="mt-8">
          <FaqAccordion items={FAQ} />
        </div>
      </div>
    </section>
  );
}
