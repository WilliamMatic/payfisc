'use client'

import { useReportWebVitals } from 'next/web-vitals'

// Définition du type pour les données analytiques
interface AnalyticsData {
  name: any;
  value: any;
  id: any;
  url: string;
  user_agent: string;
  timestamp: string;
  description?: string; // Propriété optionnelle
  severity?: string;    // Propriété optionnelle
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    // 🎯 Préparer les données pour l'API
    const analyticsData: AnalyticsData = {
      name: metric.name,
      value: metric.name === 'CLS' ? metric.value * 1000 : metric.value, // CLS en millisecondes
      id: metric.id,
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }

    // 🔥 Détection automatique des problèmes de performance
    let description = '';
    let severity = 'info';

    switch (metric.name) {
      case 'FCP': // First Contentful Paint
        if (metric.value > 3000) {
          description = 'First Contentful Paint très lent (>3s)';
          severity = 'critical';
        } else if (metric.value > 2000) {
          description = 'First Contentful Paint lent (>2s)';
          severity = 'warning';
        } else if (metric.value <= 1000) {
          description = 'First Contentful Paint excellent';
          severity = 'good';
        }
        break
        
      case 'LCP': // Largest Contentful Paint
        if (metric.value > 4000) {
          description = 'Largest Contentful Paint très lent (>4s)';
          severity = 'critical';
        } else if (metric.value > 2500) {
          description = 'Largest Contentful Paint lent (>2.5s)';
          severity = 'warning';
        } else if (metric.value <= 2000) {
          description = 'Largest Contentful Paint excellent';
          severity = 'good';
        }
        break
        
      case 'CLS': // Cumulative Layout Shift
        if (metric.value > 0.25) {
          description = 'Stabilité visuelle mauvaise (CLS > 0.25)';
          severity = 'critical';
        } else if (metric.value > 0.1) {
          description = 'Stabilité visuelle à améliorer (CLS > 0.1)';
          severity = 'warning';
        } else if (metric.value <= 0.05) {
          description = 'Stabilité visuelle excellente';
          severity = 'good';
        }
        break
        
      case 'FID': // First Input Delay
        if (metric.value > 300) {
          description = 'Délai de première interaction élevé (>300ms)';
          severity = 'critical';
        } else if (metric.value > 100) {
          description = 'Délai de première interaction acceptable (>100ms)';
          severity = 'warning';
        } else if (metric.value <= 50) {
          description = 'Délai de première interaction excellent';
          severity = 'good';
        }
        break
        
      case 'TTFB': // Time to First Byte
        if (metric.value > 800) {
          description = 'Time to First Byte lent (>800ms)';
          severity = 'critical';
        } else if (metric.value > 500) {
          description = 'Time to First Byte acceptable (>500ms)';
          severity = 'warning';
        } else if (metric.value <= 200) {
          description = 'Time to First Byte excellent';
          severity = 'good';
        }
        break
        
      case 'INP': // Interaction to Next Paint
        if (metric.value > 500) {
          description = 'Interaction to Next Paint lent (>500ms)';
          severity = 'critical';
        } else if (metric.value > 200) {
          description = 'Interaction to Next Paint à surveiller (>200ms)';
          severity = 'warning';
        } else if (metric.value <= 100) {
          description = 'Interaction to Next Paint excellent';
          severity = 'good';
        }
        break
    }

    // Ajouter les propriétés conditionnelles
    if (description) {
      analyticsData.description = description;
      analyticsData.severity = severity;
    }

    // 📤 Envoi vers l'API PHP
    sendMetricToAPI(analyticsData);

    // 📝 Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vital:', {
        metric: metric.name,
        value: metric.value,
        description: description || 'Aucun problème',
        severity: severity
      });
    }
  });

  return null; // Ce composant n'affiche rien
}

// Fonction dédiée pour l'envoi des métriques
function sendMetricToAPI(metricData: AnalyticsData) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL + '/analytics/route.php';
  const token = process.env.NEXT_PUBLIC_ANALYTICS_TOKEN;

  if (!token) {
    console.error('❌ Token analytics manquant - vérifiez vos variables d\'environnement');
    return;
  }

  // Utiliser sendBeacon pour les envois non-bloquants
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(metricData)], { type: 'application/json' });
    navigator.sendBeacon(API_URL, blob);
  } else {
    // Fallback avec fetch + keepalive
    fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(metricData),
      keepalive: true,
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Token': token
      }
    }).catch(err => {
      console.log('❌ Erreur envoi Web Vitals:', err);
    });
  }
}