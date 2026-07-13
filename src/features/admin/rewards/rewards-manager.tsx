"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Gift,
  Percent,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";
import {
  type AdminRewardRule,
  type AdminRewardsState,
  saveAdminRewards,
} from "@/app/admin/rewards/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FeedbackSegment, RewardType } from "@/types/feedback";

type RewardsManagerProps = {
  initialState: AdminRewardsState;
};

const segmentLabels: Record<FeedbackSegment, string> = {
  satisfied: "Satisfied",
  medium: "Medium",
  unhappy: "Unhappy",
};

const segmentHints: Record<FeedbackSegment, string> = {
  satisfied: "Score 4.0 and above",
  medium: "Score above 2.0 and below 4.0",
  unhappy: "Score 2.0 and below",
};

const rewardTypeOptions: { value: RewardType; label: string }[] = [
  { value: "thank_you", label: "Thank you only" },
  { value: "percentage", label: "Percentage discount" },
  { value: "fixed", label: "Fixed discount" },
  { value: "free_item", label: "Free item" },
];

const defaultMessages: Record<FeedbackSegment, { en: string; ar: string; fa: string }> = {
  satisfied: {
    en: "Thank you for your feedback. We would appreciate your review on Google Maps.",
    ar: "شكرًا لملاحظاتك. يسعدنا أن تترك لنا تقييمًا على خرائط Google.",
    fa: "از نظر شما ممنونیم. خوشحال می‌شویم در گوگل مپ هم به ما امتیاز بدهید.",
  },
  medium: {
    en: "Thank you for your feedback. We will work to improve your next experience.",
    ar: "شكرًا لملاحظاتك. سنعمل على تحسين تجربتك القادمة.",
    fa: "از نظر شما ممنونیم. تلاش می‌کنیم تجربه بعدی شما بهتر باشد.",
  },
  unhappy: {
    en: "Thank you for letting us know. Our team will review your feedback carefully.",
    ar: "شكرًا لإبلاغنا. سيقوم فريقنا بمراجعة ملاحظاتك بعناية.",
    fa: "ممنون که به ما اطلاع دادید. تیم ما نظر شما را با دقت بررسی می‌کند.",
  },
};

function makeFallbackReward(
  businessId: string,
  segment: FeedbackSegment
): AdminRewardRule {
  return {
    businessId,
    segment,
    active: true,
    messageEn: defaultMessages[segment].en,
    messageAr: defaultMessages[segment].ar,
    messageFa: defaultMessages[segment].fa,
    rewardType: segment === "satisfied" ? "percentage" : "thank_you",
    discountValue: segment === "satisfied" ? 10 : null,
    freeItemName: null,
    customExpiryDays: null,
    customUsageLimit: null,
  };
}

function normalizeRewards(state: AdminRewardsState): AdminRewardRule[] {
  const businessId = state.business?.id ?? "";
  const existing = new Map(state.rewards.map((reward) => [reward.segment, reward]));

  return (["satisfied", "medium", "unhappy"] as FeedbackSegment[]).map(
    (segment) => existing.get(segment) ?? makeFallbackReward(businessId, segment)
  );
}

export function RewardsManager({ initialState }: RewardsManagerProps) {
  const [state, setState] = useState(initialState);
  const [discountSettings, setDiscountSettings] = useState(() => ({
    defaultExpiryDays: initialState.discountSettings?.defaultExpiryDays ?? 7,
    defaultUsageLimit: initialState.discountSettings?.defaultUsageLimit ?? 1,
    codePrefix: initialState.discountSettings?.codePrefix ?? "CR",
    autoGenerateEnabled:
      initialState.discountSettings?.autoGenerateEnabled ?? true,
  }));
  const [rewards, setRewards] = useState<AdminRewardRule[]>(() =>
    normalizeRewards(initialState)
  );
  const [message, setMessage] = useState<string | null>(
    initialState.success ? null : initialState.message ?? "Failed to load rewards."
  );
  const [isPending, startTransition] = useTransition();

  const business = state.business;

  const enabledRewards = useMemo(
    () => rewards.filter((reward) => reward.active).length,
    [rewards]
  );

  const updateReward = (
    segment: FeedbackSegment,
    patch: Partial<AdminRewardRule>
  ) => {
    setRewards((current) =>
      current.map((reward) =>
        reward.segment === segment ? { ...reward, ...patch } : reward
      )
    );
  };

  const save = () => {
    if (!business) {
      setMessage("Business is missing.");
      return;
    }

    startTransition(async () => {
      const result = await saveAdminRewards({
        businessId: business.id,
        discountSettings,
        rewards: rewards.map((reward) => ({
          segment: reward.segment,
          active: reward.active,
          messageEn: reward.messageEn,
          messageAr: reward.messageAr,
          messageFa: reward.messageFa,
          rewardType: reward.rewardType,
          discountValue:
            reward.rewardType === "percentage" || reward.rewardType === "fixed"
              ? Number(reward.discountValue ?? 0)
              : null,
          freeItemName:
            reward.rewardType === "free_item" ? reward.freeItemName || "" : null,
          customExpiryDays: reward.customExpiryDays || null,
          customUsageLimit: reward.customUsageLimit || null,
        })),
      });

      if (!result.success) {
        setMessage(result.message ?? "Save failed.");
        return;
      }

      setState(result);
      setRewards(normalizeRewards(result));
      setDiscountSettings({
        defaultExpiryDays: result.discountSettings?.defaultExpiryDays ?? 7,
        defaultUsageLimit: result.discountSettings?.defaultUsageLimit ?? 1,
        codePrefix: result.discountSettings?.codePrefix ?? "CR",
        autoGenerateEnabled:
          result.discountSettings?.autoGenerateEnabled ?? true,
      });
      setMessage("Rewards saved.");
    });
  };

  const resetLocal = () => {
    setRewards(normalizeRewards(state));
    setDiscountSettings({
      defaultExpiryDays: state.discountSettings?.defaultExpiryDays ?? 7,
      defaultUsageLimit: state.discountSettings?.defaultUsageLimit ?? 1,
      codePrefix: state.discountSettings?.codePrefix ?? "CR",
      autoGenerateEnabled: state.discountSettings?.autoGenerateEnabled ?? true,
    });
    setMessage("Local changes reset.");
  };

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-amber-200/80">
              <Gift className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-[0.25em]">
                Reward Rules
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
              Rewards Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Configure the message and reward for each feedback segment. Changes
              are saved with fast RPC and applied on the next feedback submission.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-white/45">Segments</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {rewards.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-white/45">Active</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-200">
                {enabledRewards}
              </p>
            </Card>
          </div>
        </section>

        {message && (
          <div className="rounded-3xl border border-amber-200/10 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <Card className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Default Discount Code Settings
              </h2>
              <p className="mt-1 text-sm text-white/40">
                These defaults apply when a reward rule does not override expiry
                or usage limit.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="block">
              <span className="text-sm text-white/45">Default expiry days</span>
              <input
                type="number"
                min={1}
                value={discountSettings.defaultExpiryDays}
                onChange={(event) =>
                  setDiscountSettings((current) => ({
                    ...current,
                    defaultExpiryDays: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Default usage limit</span>
              <input
                type="number"
                min={1}
                value={discountSettings.defaultUsageLimit}
                onChange={(event) =>
                  setDiscountSettings((current) => ({
                    ...current,
                    defaultUsageLimit: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/45">Code prefix</span>
              <input
                value={discountSettings.codePrefix}
                onChange={(event) =>
                  setDiscountSettings((current) => ({
                    ...current,
                    codePrefix: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase text-white outline-none focus:border-amber-200/50"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:mt-7">
              <input
                type="checkbox"
                checked={discountSettings.autoGenerateEnabled}
                onChange={(event) =>
                  setDiscountSettings((current) => ({
                    ...current,
                    autoGenerateEnabled: event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <span className="text-sm text-white/70">Auto-generate codes</span>
            </label>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          {rewards.map((reward) => (
            <Card key={reward.segment} className="p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge>{segmentLabels[reward.segment]}</Badge>
                    <Badge variant={reward.active ? "success" : "secondary"}>
                      {reward.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    {segmentLabels[reward.segment]}
                  </h2>
                  <p className="mt-1 text-sm text-white/40">
                    {segmentHints[reward.segment]}
                  </p>
                </div>

                <button
                  onClick={() =>
                    updateReward(reward.segment, { active: !reward.active })
                  }
                  className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                    reward.active
                      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/45"
                  }`}
                >
                  {reward.active ? "On" : "Off"}
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-white/45">Reward type</span>
                  <select
                    value={reward.rewardType}
                    onChange={(event) =>
                      updateReward(reward.segment, {
                        rewardType: event.target.value as RewardType,
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  >
                    {rewardTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {(reward.rewardType === "percentage" ||
                  reward.rewardType === "fixed") && (
                  <label className="block">
                    <span className="text-sm text-white/45">
                      Discount value
                    </span>
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <Percent className="h-4 w-4 text-white/35" />
                      <input
                        type="number"
                        min={0}
                        value={reward.discountValue ?? 0}
                        onChange={(event) =>
                          updateReward(reward.segment, {
                            discountValue: Number(event.target.value),
                          })
                        }
                        className="w-full bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                  </label>
                )}

                {reward.rewardType === "free_item" && (
                  <label className="block">
                    <span className="text-sm text-white/45">Free item name</span>
                    <input
                      value={reward.freeItemName ?? ""}
                      onChange={(event) =>
                        updateReward(reward.segment, {
                          freeItemName: event.target.value,
                        })
                      }
                      placeholder="Free coffee"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                    />
                  </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm text-white/45">Expiry override</span>
                    <input
                      type="number"
                      min={1}
                      value={reward.customExpiryDays ?? ""}
                      onChange={(event) =>
                        updateReward(reward.segment, {
                          customExpiryDays: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                      placeholder="Default"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-white/45">Usage override</span>
                    <input
                      type="number"
                      min={1}
                      value={reward.customUsageLimit ?? ""}
                      onChange={(event) =>
                        updateReward(reward.segment, {
                          customUsageLimit: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                      placeholder="Default"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm text-white/45">Message English</span>
                  <textarea
                    rows={3}
                    value={reward.messageEn}
                    onChange={(event) =>
                      updateReward(reward.segment, {
                        messageEn: event.target.value,
                      })
                    }
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-white/45">Message Arabic</span>
                  <textarea
                    rows={3}
                    value={reward.messageAr}
                    onChange={(event) =>
                      updateReward(reward.segment, {
                        messageAr: event.target.value,
                      })
                    }
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-white/45">Message Persian</span>
                  <textarea
                    rows={3}
                    value={reward.messageFa}
                    onChange={(event) =>
                      updateReward(reward.segment, {
                        messageFa: event.target.value,
                      })
                    }
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/50"
                  />
                </label>
              </div>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-5 z-10 flex justify-end gap-3 rounded-3xl border border-white/10 bg-[#15110d]/96 p-3 shadow-2xl shadow-black/30">
          <Button variant="secondary" onClick={resetLocal} disabled={isPending}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={save} disabled={isPending || !business}>
            {isPending ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Saving..." : "Save Rewards"}
          </Button>
        </div>
      </div>
    </>
  );
}
