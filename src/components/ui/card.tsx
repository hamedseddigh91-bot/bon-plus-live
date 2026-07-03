import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bp-card group relative isolate overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.065] shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-300 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent after:pointer-events-none after:absolute after:-right-14 after:-top-14 after:h-32 after:w-32 after:rounded-full after:bg-amber-200/10 after:blur-3xl after:transition after:duration-500 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.085] hover:shadow-[0_26px_84px_rgba(0,0,0,0.28)] hover:after:bg-amber-200/16",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative z-10 p-5 pb-0", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative z-10 p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-black tracking-[-0.03em] text-white", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm leading-6 text-white/48", className)} {...props} />;
}
