"use client";

import { useEffect, useRef } from "react";
import type { AdSlotConfig } from "@/lib/types";

interface AdBannerProps {
  slot: "leaderboard" | "rectangle" | "large-rectangle";
  className?: string;
  /** Ad configuration coming from WordPress. Falls back to the placeholder. */
  config?: AdSlotConfig;
}

/**
 * Injects ad markup copied from the CMS. Scripts added through innerHTML never
 * execute per the HTML spec, so each <script> is rebuilt as a real element —
 * otherwise the AdSense <ins> renders but its loader never runs and no ad fills.
 */
function AdCode({
  code,
  slot,
  maxWidth,
}: {
  code: string;
  slot: string;
  maxWidth: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = code;

    const scripts = Array.from(container.querySelectorAll("script"));
    for (const oldScript of scripts) {
      const newScript = document.createElement("script");
      for (const attr of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.text = oldScript.text;
      oldScript.replaceWith(newScript);
    }

    // AdSense only fills slots that are pushed onto its queue.
    if (code.includes("adsbygoogle")) {
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
      } catch {
        // Blocked by an ad blocker or the loader has not arrived — ignore.
      }
    }

    return () => {
      container.innerHTML = "";
    };
  }, [code]);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center items-center overflow-hidden"
      style={{ maxWidth }}
      data-ad-slot={slot}
      aria-label="Publicidade"
    />
  );
}

export default function AdBanner({ slot, className = "", config }: AdBannerProps) {
  const sizes: Record<string, { w: number; h: number; mobileW: number; mobileH: number }> = {
    leaderboard: { w: 728, h: 90, mobileW: 320, mobileH: 50 },
    rectangle: { w: 300, h: 250, mobileW: 300, mobileH: 250 },
    "large-rectangle": { w: 336, h: 280, mobileW: 300, mobileH: 250 },
  };

  const { w, h, mobileW, mobileH } = sizes[slot];

  const code = typeof config?.code === "string" ? config.code.trim() : "";
  const hasAd = config?.enabled === true && code.length > 0;

  if (hasAd) {
    return (
      <div className={`flex justify-center items-center ${className}`}>
        <AdCode code={code} slot={slot} maxWidth={w} />
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      {/* Placeholder shown until WordPress provides ad code for this slot */}
      <div
        className="hidden sm:flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded text-xs text-gray-400 font-medium select-none"
        style={{ width: w, height: h, maxWidth: "100%" }}
        aria-label="Publicidade"
      >
        Publicidade {w}×{h}
      </div>
      <div
        className="flex sm:hidden items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded text-xs text-gray-400 font-medium select-none"
        style={{ width: mobileW, height: mobileH, maxWidth: "100%" }}
        aria-label="Publicidade"
      >
        Publicidade {mobileW}×{mobileH}
      </div>
    </div>
  );
}
