"use client";

import { MoveDiagonal } from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";
import { memo } from "react";
import { Button } from "./ui/button";
import { type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
}) {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Médica</h1>
        <Link href={`/chat/${chatId}`}>
          <Button variant="outline">
            <MoveDiagonal />
          </Button>
        </Link>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
