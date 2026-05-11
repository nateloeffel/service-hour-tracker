"use client";

import { useState, useTransition, useRef, useEffect, useLayoutEffect } from "react";
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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const assignedIds = new Set(assigned.map((f) => f.id));
  const unassigned = available.filter((f) => !assignedIds.has(f.id));

  // Position the popover relative to the trigger button, using viewport
  // coordinates so it escapes any `overflow` parent (the roster table clips
  // absolute-positioned popovers).
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = 192; // w-48
    let left = rect.left;
    // Flip to the right edge if it would overflow viewport
    if (left + popoverWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - popoverWidth - 8);
    }
    setCoords({ top: rect.bottom + 4, left });
  }, [open]);

  // Close on outside click, escape, scroll, or resize.
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  function handleAssign(flagId: string) {
    setOpen(false);
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
    <div className="flex flex-wrap items-center gap-1.5">
      {assigned.map((f) => (
        <FlagPill
          key={f.id}
          name={f.name}
          color={f.color}
          onRemove={() => handleRemove(f.id)}
        />
      ))}

      {available.length > 0 && (
        <>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen(!open)}
            disabled={isPending}
            className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            + Flag
          </button>

          {open && coords && (
            <div
              ref={popoverRef}
              className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
              style={{ top: coords.top, left: coords.left }}
            >
              {unassigned.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-gray-500">
                  All flags assigned
                </p>
              ) : (
                unassigned.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleAssign(f.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-gray-100"
                  >
                    <FlagPill name={f.name} color={f.color} />
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
