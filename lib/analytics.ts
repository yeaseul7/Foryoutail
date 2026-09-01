'use client';

export type AnalyticsEventName =
  | 'view_animal_list'
  | 'view_animal_detail'
  | 'save_animal'
  | 'complete_ai_search'
  | 'share_animal';

type AnalyticsValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsValue | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (
      command: 'event',
      eventName: AnalyticsEventName,
      params?: Record<string, AnalyticsValue>,
    ) => void;
  }
}

export function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsParams = {},
): void {
  if (typeof window === 'undefined') return;

  const definedParams = Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, AnalyticsValue] => entry[1] !== undefined),
  );

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', eventName, definedParams);
  }

  window.dataLayer ??= [];
  window.gtag ??= (...args) => {
    window.dataLayer?.push(args);
  };
  window.gtag('event', eventName, definedParams);
}
