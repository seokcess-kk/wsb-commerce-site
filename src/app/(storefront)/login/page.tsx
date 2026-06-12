import { AuthForm } from "@/components/auth/auth-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-6 text-2xl font-extrabold text-ng-charcoal">로그인</h1>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {decodeURIComponent(error)}
        </p>
      )}
      <AuthForm mode="login" />
      <p className="mt-3 text-center text-sm">
        <a href="/auth/reset" className="text-ng-cobalt hover:underline">비밀번호를 잊으셨나요?</a>
      </p>
      <div className="my-6 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />또는<span className="h-px flex-1 bg-stone-200" /></div>
      <SocialButtons />
    </section>
  );
}
