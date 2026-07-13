import BrandMark from "./brand-mark";

export default function LoadingSpinner({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <span
      className="inline-grid place-items-center"
      role={compact ? undefined : "status"}
    >
      <BrandMark
        className={`text-secondary animate-spin ${compact ? "text-base" : "text-6xl"}`}
      />
      {!compact && <span className="sr-only">Loading</span>}
    </span>
  );
}
