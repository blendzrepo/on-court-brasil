"use client";

interface AdBannerProps {
  slot: "leaderboard" | "rectangle" | "large-rectangle";
  className?: string;
}

export default function AdBanner({ slot, className = "" }: AdBannerProps) {
  const sizes: Record<string, { w: number; h: number; mobileW: number; mobileH: number }> = {
    leaderboard: { w: 728, h: 90, mobileW: 320, mobileH: 50 },
    rectangle: { w: 300, h: 250, mobileW: 300, mobileH: 250 },
    "large-rectangle": { w: 336, h: 280, mobileW: 300, mobileH: 250 },
  };

  const { w, h, mobileW, mobileH } = sizes[slot];

  return (
    <div className={`flex justify-center items-center ${className}`}>
      {/* Replace this div with actual Google AdSense code */}
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
