"use client";

import { useEffect, useRef } from "react";

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
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    let stopped = false;
    let attempts = 0;

    const pushAd = () => {
      if (stopped) return;

      const adElement = adRef.current;
      if (!adElement) return;
      if (
        adElement.dataset.adInitialized === "true" ||
        adElement.dataset.adInitialized === "failed"
      ) {
        return;
      }

      if (window.adsbygoogle) {
        try {
          window.adsbygoogle.push({});
          adElement.dataset.adInitialized = "true";
          return;
        } catch {
          adElement.dataset.adInitialized = "failed";
          return;
        }
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
      ref={adRef}
      className="adsbygoogle"
      style={{ display: "block", textAlign: "center" }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
