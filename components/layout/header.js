"use client";

import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b border-border bg-white/60 backdrop-blur-xl flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        {session?.user && (
          <>
            <span className="text-[13px] text-gray-muted">{session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[13px] text-gray-brand hover:text-navy transition-colors duration-200"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
