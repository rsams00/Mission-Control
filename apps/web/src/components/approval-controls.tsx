"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveStageAction, rejectStageAction } from "@/lib/actions";
import { Check, X } from "lucide-react";

export function ApprovalControls({
  projectId,
  stageId,
  deliverableId,
}: {
  projectId: string;
  stageId: string;
  deliverableId: string;
}) {
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {!showReject ? (
        <div className="flex gap-2">
          <Button
            disabled={isPending}
            onClick={() => startTransition(() => approveStageAction(projectId, stageId, deliverableId))}
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button variant="outline" disabled={isPending} onClick={() => setShowReject(true)}>
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="What needs to change?"
            value={feedback}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={isPending || feedback.trim().length === 0}
              onClick={() =>
                startTransition(async () => {
                  await rejectStageAction(projectId, stageId, feedback.trim());
                  setShowReject(false);
                  setFeedback("");
                })
              }
            >
              Send feedback &amp; re-queue
            </Button>
            <Button variant="ghost" disabled={isPending} onClick={() => setShowReject(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
