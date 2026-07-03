import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "amber" | "secondary";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const styles: Record<BadgeVariant, string> = {
  default: "border-white/10 bg-white/[0.075] text-white/62",
  secondary: "border-white/10 bg-white/[0.075] text-white/62",
  success: "border-emerald-300/18 bg-emerald-300/10 text-emerald-100 shadow-emerald-500/5",
  warning: "border-orange-300/18 bg-orange-300/10 text-orange-100 shadow-orange-500/5",
  danger: "border-red-300/18 bg-red-400/10 text-red-100 shadow-red-500/5",
  amber: "border-amber-300/18 bg-amber-300/10 text-amber-100 shadow-amber-500/5",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_22px_rgba(0,0,0,0.08)] backdrop-blur-md",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
