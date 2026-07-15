type LoaderProps = {
  size?: "sm" | "md";
  label?: string;
  className?: string;
};

export function Loader({ size = "md", label = "Loading", className = "" }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`bp-loader ${size === "sm" ? "bp-loader-sm" : ""} ${className}`.trim()}
    >
      Load ng
    </span>
  );
}

export function LoaderScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <Loader label={label} />
    </div>
  );
}
