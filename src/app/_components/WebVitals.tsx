'use client'

import { useReportWebVitals } from 'next/web-vitals'

interface AnalyticsData {
  name: any;
  value: any;
  id: any;
  url: string;
  user_agent: string;
  timestamp: string;
  description?: string;
  severity?: string;
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    // 🔥 CORRECTION : Ne pas multiplier CLS par 1000
    // CLS est déjà une valeur décimale (0.1, 0.25, etc.)
    const metricValue = metric.name === 'CLS' ? metric.value : metric.value;
    
    const analyticsData: AnalyticsData = {
      name: metric.name,
      value: metricValue,
      id: metric.id,
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }

    // Détection des problèmes (version corrigée)
    let description = '';
    let severity = 'info';

    switch (metric.name) {
      case 'FCP':
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
        break;
        
      case 'LCP':
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
        break;
        
      case 'CLS':
        // CLS est déjà en valeur décimale
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
        break;
        
      case 'FID':
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
        break;
        
      case 'TTFB':
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
        break;
        
      case 'INP':
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
        break;
    }

    if (description) {
      analyticsData.description = description;
      analyticsData.severity = severity;
    }

    // 📤 Envoi vers l'API
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

  return null;
}

// Fonction d'envoi améliorée avec meilleure gestion d'erreurs
function sendMetricToAPI(metricData: AnalyticsData) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL + '/analytics/route.php';
  const token = process.env.NEXT_PUBLIC_ANALYTICS_TOKEN;

  // Debug: vérifier les variables d'environnement
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Configuration:', {
      hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
      hasToken: !!token,
      apiUrl: API_URL
    });
  }

  if (!token) {
    console.error('❌ Token analytics manquant');
    return;
  }

  if (!API_URL || API_URL.includes('undefined')) {
    console.error('❌ URL API manquante ou invalide');
    return;
  }

  try {
    // Utiliser sendBeacon pour les envois non-bloquants
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(metricData)], { type: 'application/json' });
      const success = navigator.sendBeacon(API_URL, blob);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 SendBeacon result:', success);
      }
    } else {
      // Fallback avec fetch
      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(metricData),
        keepalive: true,
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Token': token
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Métrique envoyée avec succès:', data);
        }
      })
      .catch(err => {
        console.error('❌ Erreur envoi Web Vitals:', err);
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
  }
}