import { cn } from "@/lib/utils";

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  purple: "bg-purple-100 text-purple-800",
  gray: "bg-gray-100 text-gray-800",
};

export function FlagPill({
  name,
  color,
  onRemove,
  className,
}: {
  name: string;
  color: string;
  onRemove?: () => void;
  className?: string;
}) {
  const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colorClass,
        className,
      )}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

export const FLAG_COLOR_PALETTE = Object.keys(COLOR_CLASSES);
