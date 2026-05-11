"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { FlagPill } from "./flag-pill";

type Flag = { id: string; name: string; color: string };

export function MemberFlags({
  clubId,
  membershipId,
  assigned,
  available,
  onAssign,
  onUnassign,
}: {
  clubId: string;
  membershipId: string;
  assigned: Flag[];
  available: Flag[];
  onAssign: (clubId: string, membershipId: string, flagId: string) => Promise<void>;
  onUnassign: (clubId: string, membershipId: string, flagId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const assignedIds = new Set(assigned.map((f) => f.id));
  const unassigned = available.filter((f) => !assignedIds.has(f.id));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleAssign(flagId: string) {
    startTransition(async () => {
      await onAssign(clubId, membershipId, flagId);
    });
  }

  function handleRemove(flagId: string) {
    startTransition(async () => {
      await onUnassign(clubId, membershipId, flagId);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" ref={ref}>
      {assigned.map((f) => (
        <FlagPill
          key={f.id}
          name={f.name}
          color={f.color}
          onRemove={() => handleRemove(f.id)}
        />
      ))}

      {available.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            disabled={isPending}
            className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            + Flag
          </button>

          {open && (
            <div className="absolute left-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
              {unassigned.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-gray-500">
                  All flags assigned
                </p>
              ) : (
                unassigned.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      handleAssign(f.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-gray-100"
                  >
                    <FlagPill name={f.name} color={f.color} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
