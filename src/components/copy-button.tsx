"use client";

import { useState } from "react";

export function CopyInviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / insecure contexts
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
      />
      <button
        type="button"
        onClick={handleCopy}
        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          copied
            ? "bg-green-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
