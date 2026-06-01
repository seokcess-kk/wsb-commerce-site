import { listActiveBanners } from "@/db/queries/banners";
import { listPublishedProducts } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, products] = await Promise.all([listActiveBanners(), listPublishedProducts()]);
  const hero = banners[0];
  return (
    <div>
      {hero ? (
        <a href={hero.linkUrl ?? "#"} className="block border-t-2 border-ng-neon bg-ng-cobalt px-6 py-16 text-white">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-widest text-ng-neon">WSB</p>
            <h1 className="mt-2 text-3xl font-extrabold">{hero.title}</h1>
          </div>
        </a>
      ) : (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-ng-cobalt">New Launch · NUTROGIN</p>
          <h1 className="mt-2 text-3xl font-extrabold text-wsb-carbon">Sharper mind, brighter day.</h1>
        </section>
      )}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-5 text-xl font-extrabold text-wsb-carbon">베스트 상품</h2>
        <ProductGrid products={products.slice(0, 8)} />
      </section>
    </div>
  );
}
