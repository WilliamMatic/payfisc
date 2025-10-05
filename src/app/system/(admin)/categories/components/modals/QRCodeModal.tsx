import { X, Download, Printer, QrCode, FileText, Calendar, Hash } from 'lucide-react';
import { Impot as ImpotType } from '@/services/impots/impotService';
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  impot: ImpotType;
  onClose: () => void;
}

export default function QRCodeModal({
  impot,
  onClose
}: QRCodeModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Données pour le QR Code
  const qrData = JSON.stringify({
    id: impot.id,
    nom: impot.nom,
    description: impot.description,
    periode: impot.periode,
    delai_accord: impot.delai_accord,
    penalites: impot.penalites,
    actif: impot.actif,
    type: 'impot',
    timestamp: new Date().toISOString()
  });

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleDownload = () => {
    // Pour télécharger le QR Code SVG, on peut convertir en PNG
    const svgElement = document.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `qrcode-impot-${impot.id}-${impot.nom}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
        <div 
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-90 zoom-in-90 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg mr-3">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">QR Code Impôt</h3>
                <p className="text-sm text-gray-600">Code d'identification et de partage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-5">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* QR Code Section */}
              <div className="flex-1 flex justify-center">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <div className="bg-white p-4 rounded-lg shadow-inner flex justify-center">
                    <QRCodeSVG
                      value={qrData}
                      size={200}
                      level="H" // Niveau de correction d'erreur élevé
                      includeMargin={true}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      marginSize={4}
                    />
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-xs text-gray-600 font-mono">
                      ID: {impot.id} | {impot.nom}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informations Section */}
              <div className="flex-1">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <FileText className="w-4 h-4 text-purple-500 mr-2" />
                      <h4 className="font-semibold text-gray-800">Informations de l'Impôt</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Nom:</span>
                        <span className="font-semibold text-gray-800">{impot.nom}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">ID:</span>
                        <div className="flex items-center">
                          <Hash className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="font-mono text-sm font-semibold text-gray-800">{impot.id}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Période:</span>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="font-semibold text-gray-800 capitalize">{impot.periode || 'Non spécifiée'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Statut:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          impot.actif 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {impot.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h5 className="font-medium text-yellow-800 text-sm mb-2">Utilisation du QR Code</h5>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• Scan pour accéder aux détails de l'impôt</li>
                      <li>• Identification rapide du type d'impôt</li>
                      <li>• Partage simplifié des informations</li>
                      <li>• Contient toutes les données importantes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>Description:</strong> {impot.description || "Aucune description disponible"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center space-x-3 p-5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium text-sm disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Impression...' : 'Imprimer'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Version imprimable */}
      <div className="hidden">
        <div ref={printRef} className="print-area p-8 bg-white">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800 mb-2">QR Code Impôt</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-3"></div>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-800">{impot.nom}</h2>
              <p className="text-gray-600 text-sm">ID: {impot.id} | Période: {impot.periode}</p>
              <p className="text-gray-600 text-xs mt-1">{impot.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Généré le: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="flex justify-center my-8">
            <div className="bg-white p-6 border-2 border-gray-300 rounded-lg flex justify-center">
              <QRCodeSVG
                value={qrData}
                size={180}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
                marginSize={4}
              />
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-xs text-gray-600 font-mono">
              ID: {impot.id} | {impot.nom}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Détails de l'Impôt</h4>
              <p className="text-gray-600"><strong>Nom:</strong> {impot.nom}</p>
              <p className="text-gray-600"><strong>ID:</strong> {impot.id}</p>
              <p className="text-gray-600"><strong>Période:</strong> {impot.periode}</p>
              <p className="text-gray-600"><strong>Statut:</strong> {impot.actif ? 'Actif' : 'Inactif'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Utilisation</h4>
              <p className="text-gray-600">Scanner avec un lecteur QR Code</p>
              <p className="text-gray-600">Valide jusqu'à modification</p>
              <p className="text-gray-600">Contient toutes les données importantes</p>
            </div>
          </div>

          {impot.description && (
            <div className="bg-gray-50 p-3 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-800 mb-1">Description</h4>
              <p className="text-gray-600 text-sm">{impot.description}</p>
            </div>
          )}

          <footer className="mt-6 pt-3 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">
              Document généré automatiquement - Système de Gestion des Impôts
            </p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
            margin: 0;
            padding: 0;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white;
            padding: 15mm;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}