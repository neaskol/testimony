"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendInvitation } from "@/actions/auth";
import { toast } from "sonner";

export function ResendInviteButton({ userId }: { userId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleResend() {
    setIsPending(true);
    const result = await resendInvitation(userId);
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Invitation renvoyée avec succès");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleResend}
      disabled={isPending}
      title="Renvoyer l'invitation"
    >
      <RotateCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
    </Button>
  );
}
