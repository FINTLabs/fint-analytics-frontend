import { useEffect, useRef } from "react";
import { useTrackAnalytics } from "~/sdk/AnalyticsProvider";
import type { TrackAnalyticsInput } from "~/sdk/types";

export type TrackAnalyticsProps = TrackAnalyticsInput & {
  enabled?: boolean;
  trackOnce?: boolean;
};

export function TrackAnalytics({
  enabled = true,
  trackOnce = true,
  type,
  ts,
  url,
  path,
  element,
  tenant,
  meta,
}: TrackAnalyticsProps) {
  const track = useTrackAnalytics();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (trackOnce && hasTrackedRef.current) {
      return;
    }

    track({ type, ts, url, path, element, tenant, meta });
    hasTrackedRef.current = true;
  }, [enabled, trackOnce, track, type, ts, url, path, element, tenant, meta]);

  return null;
}
