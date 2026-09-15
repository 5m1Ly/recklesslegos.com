"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: {
      push: (value: Record<string, never>) => void;
    };
  }
}

type AdSenseBlockProps = {
  clientId: string;
  slotId: string;
};

export function AdSenseBlock({ clientId, slotId }: AdSenseBlockProps) {
  useEffect(() => {
    let stopped = false;
    let attempts = 0;

    const pushAd = () => {
      if (stopped) return;

      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
        return;
      }

      attempts += 1;
      if (attempts < 40) {
        window.setTimeout(pushAd, 250);
      }
    };

    pushAd();
    return () => {
      stopped = true;
    };
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center" }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
