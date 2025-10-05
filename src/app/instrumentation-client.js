// instrumentation-client.js

console.log('🚀 Analytics & Error Tracking Initialized');

// 🔥 Initialisation des analytics globaux
if (typeof window !== 'undefined') {
  // Suivi des erreurs JavaScript globaux
  window.addEventListener('error', (event) => {
    const errorData = {
      name: 'JS_ERROR',
      value: 0,
      id: `error_${Date.now()}`,
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      description: `Erreur: ${event.message} à ${event.filename}:${event.lineno}`,
      timestamp: new Date().toISOString()
    };

    // Envoyer l'erreur à l'API
    sendToAnalyticsAPI(errorData);
  });

  // Suivi des Promise non catchées
  window.addEventListener('unhandledrejection', (event) => {
    const errorData = {
      name: 'PROMISE_REJECTION',
      value: 0,
      id: `promise_${Date.now()}`,
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      description: `Promise rejetée: ${event.reason}`,
      timestamp: new Date().toISOString()
    };

    sendToAnalyticsAPI(errorData);
  });

  // Suivi de la navigation
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      
      const navigationData = {
        name: 'PAGE_VIEW',
        value: performance.now(),
        id: `nav_${Date.now()}`,
        url: window.location.pathname,
        user_agent: navigator.userAgent,
        description: `Navigation vers ${window.location.pathname}`,
        timestamp: new Date().toISOString()
      };

      sendToAnalyticsAPI(navigationData);
    }
  }).observe(document, { subtree: true, childList: true });

  console.log('✅ Instrumentation client activée');
}

// Fonction utilitaire pour envoyer les données
function sendToAnalyticsAPI(data) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL + '/analytics/route.php';
  const token = process.env.NEXT_PUBLIC_ANALYTICS_TOKEN;

  if (!token) {
    console.error('❌ Token analytics manquant dans instrumentation');
    return;
  }

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(API_URL, blob);
    } else {
      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true,
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Token': token
        }
      }).catch(err => {
        console.log('❌ Erreur envoi instrumentation:', err);
      });
    }
  } catch (error) {
    console.log('❌ Erreur instrumentation:', error);
  }
}