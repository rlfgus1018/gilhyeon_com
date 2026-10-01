import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/icons";
import { signInWith } from "@/lib/auth/actions";
import type { AllowedNextPath } from "@/lib/auth/next-path";

export function SignInButtons({ next }: { next: AllowedNextPath }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form action={signInWith}>
        <input type="hidden" name="provider" value="github" />
        <input type="hidden" name="next" value={next} />
        <Button type="submit" className="w-full">
          <GitHubIcon className="size-4" />
          GitHub로 계속하기
        </Button>
      </form>
      <form action={signInWith}>
        <input type="hidden" name="provider" value="google" />
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon className="size-4" />
          Google로 계속하기
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3c-.5-1.5-.5-3.1 0-4.6V6.6H1.3C-.4 10 -.4 14 1.3 17.4l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}
