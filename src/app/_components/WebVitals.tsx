'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { useEffect, useRef } from 'react'

interface AnalyticsData {
  name: string;
  value: number;
  id: string;
  url: string;
  user_agent: string;
  timestamp: string;
  description?: string;
  severity?: string;
}

export function WebVitals() {
  const queueRef = useRef<AnalyticsData[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const flushQueue = () => {
      if (queueRef.current.length === 0) return;
      const batch = queueRef.current.splice(0);
      sendBatchToAPI(batch);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushQueue();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flushQueue);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flushQueue);
    };
  }, []);

  useReportWebVitals((metric) => {
    const analyticsData: AnalyticsData = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    let description = '';
    let severity = 'info';

    switch (metric.name) {
      case 'FCP':
        if (metric.value > 3000) { description = 'First Contentful Paint très lent (>3s)'; severity = 'critical'; }
        else if (metric.value > 2000) { description = 'First Contentful Paint lent (>2s)'; severity = 'warning'; }
        else if (metric.value <= 1000) { description = 'First Contentful Paint excellent'; severity = 'good'; }
        break;
      case 'LCP':
        if (metric.value > 4000) { description = 'Largest Contentful Paint très lent (>4s)'; severity = 'critical'; }
        else if (metric.value > 2500) { description = 'Largest Contentful Paint lent (>2.5s)'; severity = 'warning'; }
        else if (metric.value <= 2000) { description = 'Largest Contentful Paint excellent'; severity = 'good'; }
        break;
      case 'CLS':
        if (metric.value > 0.25) { description = 'Stabilité visuelle mauvaise (CLS > 0.25)'; severity = 'critical'; }
        else if (metric.value > 0.1) { description = 'Stabilité visuelle à améliorer (CLS > 0.1)'; severity = 'warning'; }
        else if (metric.value <= 0.05) { description = 'Stabilité visuelle excellente'; severity = 'good'; }
        break;
      case 'FID':
        if (metric.value > 300) { description = 'Délai de première interaction élevé (>300ms)'; severity = 'critical'; }
        else if (metric.value > 100) { description = 'Délai de première interaction acceptable (>100ms)'; severity = 'warning'; }
        else if (metric.value <= 50) { description = 'Délai de première interaction excellent'; severity = 'good'; }
        break;
      case 'TTFB':
        if (metric.value > 800) { description = 'Time to First Byte lent (>800ms)'; severity = 'critical'; }
        else if (metric.value > 500) { description = 'Time to First Byte acceptable (>500ms)'; severity = 'warning'; }
        else if (metric.value <= 200) { description = 'Time to First Byte excellent'; severity = 'good'; }
        break;
      case 'INP':
        if (metric.value > 500) { description = 'Interaction to Next Paint lent (>500ms)'; severity = 'critical'; }
        else if (metric.value > 200) { description = 'Interaction to Next Paint à surveiller (>200ms)'; severity = 'warning'; }
        else if (metric.value <= 100) { description = 'Interaction to Next Paint excellent'; severity = 'good'; }
        break;
    }

    if (description) {
      analyticsData.description = description;
      analyticsData.severity = severity;
    }

    queueRef.current.push(analyticsData);

    // Envoi groupé après 3 s sans nouvelle métrique
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (queueRef.current.length === 0) return;
      const batch = queueRef.current.splice(0);
      sendBatchToAPI(batch);
    }, 3000);

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital:', { metric: metric.name, value: metric.value, description: description || 'OK', severity });
    }
  });

  return null;
}

function sendBatchToAPI(batch: AnalyticsData[]) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL + '/analytics/route.php';
  const token = process.env.NEXT_PUBLIC_ANALYTICS_TOKEN;

  if (!token || !API_URL || API_URL.includes('undefined')) return;

  try {
    const payload = JSON.stringify(batch);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(API_URL, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(API_URL, {
        method: 'POST',
        body: payload,
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'X-API-Token': token },
      }).catch(() => {});
    }
  } catch (_) {}
}