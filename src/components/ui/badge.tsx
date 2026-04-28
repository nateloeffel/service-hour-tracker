import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-800",
  blue: "bg-blue-100 text-blue-800",
};

export function Badge({
  variant = "gray",
  children,
  className,
}: {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant] || variants.gray,
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: string; label: string }> = {
    PENDING: { variant: "yellow", label: "Pending" },
    APPROVED: { variant: "green", label: "Approved" },
    REJECTED: { variant: "red", label: "Rejected" },
  };
  const { variant, label } = map[status] || { variant: "gray", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
