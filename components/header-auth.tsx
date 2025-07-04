import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { User } from "lucide-react";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
        <div className="hidden sm:block">
          <Badge
            variant={"default"}
            className="font-normal pointer-events-none text-xs"
          >
            Please update .env.local file
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            variant={"outline"}
            disabled
            className="opacity-75 cursor-none pointer-events-none text-xs px-3 h-8 sm:h-9"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={"default"}
            disabled
            className="opacity-75 cursor-none pointer-events-none text-xs px-3 h-8 sm:h-9"
          >
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="hidden sm:flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground truncate max-w-[120px] lg:max-w-[180px]">
          {user.email}
        </span>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"} size="sm" className="text-xs px-3 h-8 sm:h-9 whitespace-nowrap">
          Sign out
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"} className="text-xs px-3 h-8 sm:h-9 whitespace-nowrap">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"} className="text-xs px-3 h-8 sm:h-9 whitespace-nowrap">
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
