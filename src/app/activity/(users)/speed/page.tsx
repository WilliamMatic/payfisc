'use client';

import React from 'react';
import QRCode from 'react-qr-code';

export default function Page() {
  // Texte encodé dans le QR — le scan affichera directement ce texte.
  const qrValue = "bonjour je t'aime";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="bg-white rounded-lg p-8 max-w-md shadow-lg">
          <div className="text-4xl mb-4">👩‍💼</div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Bienvenue
          </h1>
          <p className="text-gray-600 mb-6">
            Content de vous revoir dans votre espace.
          </p>

          <div className="inline-block bg-white p-4 rounded-md">
            {/* Conteneur pour centrer le QR */}
            <div style={{ background: 'white', padding: 12, display: 'inline-block' }}>
              <QRCode value={qrValue} size={160} />
            </div>

            <p className="text-sm text-gray-500 mt-3">
              Scannez le QR pour voir le message.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
