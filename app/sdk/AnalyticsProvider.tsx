import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { createAnalyticsClient } from "~/sdk/client";
import type { AnalyticsClientConfig, TrackAnalyticsInput } from "~/sdk/types";

type AnalyticsContextValue = {
  track: (event: TrackAnalyticsInput) => void;
  flush: () => Promise<void>;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export type AnalyticsProviderProps = AnalyticsClientConfig & {
  children: ReactNode;
};

export function AnalyticsProvider({
  app,
  endpoint,
  token,
  tenant,
  flushIntervalMs,
  maxBatchSize,
  children,
}: AnalyticsProviderProps) {
  const client = useMemo(
    () =>
      createAnalyticsClient({
        app,
        endpoint,
        token,
        tenant,
        flushIntervalMs,
        maxBatchSize,
      }),
    [app, endpoint, token, tenant, flushIntervalMs, maxBatchSize],
  );

  useEffect(() => {
    return () => {
      void client.shutdown();
    };
  }, [client]);

  const contextValue = useMemo(
    () => ({
      track: client.track,
      flush: client.flush,
    }),
    [client],
  );

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>;
}

export function useTrackAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useTrackAnalytics must be used inside an AnalyticsProvider");
  }

  return context.track;
}

export function useFlushAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useFlushAnalytics must be used inside an AnalyticsProvider");
  }

  return context.flush;
}
