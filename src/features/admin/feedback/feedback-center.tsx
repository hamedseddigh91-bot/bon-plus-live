"use client";

import type { FeedbackInboxState } from "@/app/admin/feedback/actions";
import { FeedbackInbox } from "@/features/admin/feedback/feedback-inbox";

type FeedbackCenterProps = {
  initialState: FeedbackInboxState;
};

export function FeedbackCenter({ initialState }: FeedbackCenterProps) {
  return <FeedbackInbox initialState={initialState} />;
}
