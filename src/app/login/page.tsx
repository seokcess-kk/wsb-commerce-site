import { AuthForm } from "@/components/auth/auth-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-6 text-2xl font-extrabold text-wsb-carbon">로그인</h1>
      <AuthForm mode="login" />
      <div className="my-6 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />또는<span className="h-px flex-1 bg-stone-200" /></div>
      <SocialButtons />
    </section>
  );
}
