"use client";

import { MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";

export default function MessagesPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-nova-bg pb-24 md:pb-16">
      <BottomNav />

      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col items-center justify-center px-6 text-center md:max-w-2xl">
        <div className="flex size-12 items-center justify-center rounded-full bg-nova-accent/10 text-nova-accent">
          <MessageCircle className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-nova-text">Messages are coming soon</h1>
        <p className="mt-1.5 text-sm text-nova-muted">
          You&apos;ll be able to message your coach directly from here.
        </p>
      </div>
    </div>
  );
}
