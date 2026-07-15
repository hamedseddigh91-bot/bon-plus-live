import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "relative overflow-hidden bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 text-black shadow-[0_18px_44px_rgba(251,191,36,0.20)] before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.55),transparent)] before:-translate-x-full before:transition before:duration-700 hover:shadow-[0_22px_62px_rgba(251,191,36,0.30)] hover:before:translate-x-full",
  secondary:
    "border border-white/10 bg-white/[0.075] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_34px_rgba(0,0,0,0.14)] hover:border-white/18 hover:bg-white/[0.13] hover:text-white",
  ghost: "bg-transparent text-white/62 hover:bg-white/[0.08] hover:text-white",
  danger:
    "border border-red-300/20 bg-red-400/10 text-red-100 shadow-[0_14px_34px_rgba(248,113,113,0.08)] hover:bg-red-400/16 hover:text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 rounded-2xl px-4 text-xs",
  md: "h-12 rounded-2xl px-5 text-sm",
  lg: "h-14 rounded-3xl px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-black transition duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader size="sm" /> : children}
      </button>
    );
  },
);

Button.displayName = "Button";
