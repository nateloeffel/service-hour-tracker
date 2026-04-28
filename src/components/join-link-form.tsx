"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

function extractJoinPath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try as full URL
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/join\/(.+)/);
    if (match) return `/join/${match[1]}`;
  } catch {
    // Not a URL
  }

  // Try as path-like string
  const match = trimmed.match(/\/join\/(.+)/);
  if (match) return `/join/${match[1]}`;

  // Treat as raw token
  if (!trimmed.includes("/")) return `/join/${trimmed}`;

  return null;
}

export function JoinLinkForm() {
  const [link, setLink] = useState("");
  const router = useRouter();

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const path = extractJoinPath(link);
    if (path) router.push(path);
  }

  return (
    <form onSubmit={handleJoin} className="flex gap-2">
      <input
        type="text"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Paste invite link here..."
        className="block w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!link.trim()}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Join
      </button>
    </form>
  );
}

export function JoinClubButton() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const path = extractJoinPath(link);
    if (path) {
      setOpen(false);
      router.push(path);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Join Club
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <p className="text-sm font-medium text-gray-900">Join a club</p>
          <p className="mt-1 text-xs text-gray-500">
            Paste the invite link you received.
          </p>
          <form onSubmit={handleJoin} className="mt-3 flex gap-2">
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste invite link..."
              autoFocus
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!link.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Join
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
