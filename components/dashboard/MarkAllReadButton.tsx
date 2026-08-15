"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function markAll() {
    setWorking(true);
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(
      () => undefined
    );
    router.refresh();
    setWorking(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={markAll} disabled={working}>
      {working ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCheck className="size-4" aria-hidden="true" />
      )}
      Mark all read
    </Button>
  );
}
