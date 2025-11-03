"use client";
import { useRef, useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';

interface PrintData {
  nom: string;
  prenom: string;
  adresse: string;
  nif: string;
  numero_plaque: string;
  annee_circulation: string;
  marque: string;
  type_engin: string;
  usage: string;
  numero_chassis: string;
  numero_moteur: string;
  annee_fabrication: string;
  couleur: string;
  puissance_fiscal: string;
  energie: string;
}

interface ImmatriculationPrintProps {
  data: PrintData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImmatriculationPrint({ data, isOpen, onClose }: ImmatriculationPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Immatriculation - ${data.numero_plaque}</title>
            <style>
              @page { 
                size: auto; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 10mm; 
                background: #fff; 
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                box-sizing: border-box;
              }
              
              /* TAILLE EXACTE 86mm × 54mm pour l'impression */
              .card {
                width: 86mm;
                height: 54mm;
                border: 0.5mm solid #000;
                border-radius: 1mm;
                padding: 2.5mm;
                box-sizing: border-box;
                position: relative;
                background: #fff;
              }
              
              table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 2.8mm; 
              }
              
              td, th { 
                padding: 1mm; 
                text-align: left; 
                vertical-align: middle; 
                border-bottom: 0.2mm solid #eee;
              }
              
              th { 
                width: 45%; 
                font-weight: 700; 
                font-size: 3.0mm; 
              }
              
              td { 
                width: 55%; 
                font-weight: 500; 
              }

              .plaque-number {
                font-weight: bold;
                font-size: 3.2mm;
                color: #dc2626;
              }

              .qr { 
                position: absolute; 
                right: 2.5mm; 
                bottom: 2.5mm; 
                width: 12mm; 
                height: 12mm; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                border: 0.2mm solid #000;
                padding: 0.5mm;
                background: white;
              }

              .sig-wrap { 
                position: absolute; 
                right: 2.5mm; 
                bottom: 2.5mm; 
                width: 28mm; 
                height: 10mm; 
                display: flex; 
                align-items: flex-end; 
                justify-content: center; 
              }
              
              .signature-box { 
                width: 100%; 
                border-top: 0.2mm dashed rgba(0,0,0,0.6); 
                padding-top: 1.5mm; 
                font-size: 2.4mm; 
                text-align: center; 
              }

              @media print {
                body {
                  padding: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
              }
            </style>
          </head>
          <body>
            <!-- RECTO SEULEMENT POUR L'IMPRESSION -->
            <div class="card">
              <table>
                <tbody>
                  <tr>
                    <th>Nom / Raison sociale</th>
                    <td>${data.nom} ${data.prenom}</td>
                  </tr>
                  <tr>
                    <th>Adresse physique</th>
                    <td>${data.adresse}</td>
                  </tr>
                  <tr>
                    <th>N.Impôt</th>
                    <td>${data.nif}</td>
                  </tr>
                  <tr>
                    <th>Année de mise en circulation</th>
                    <td>${data.annee_circulation}</td>
                  </tr>
                  <tr>
                    <th>N. Plaque</th>
                    <td class="plaque-number">${data.numero_plaque}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="qr">
                <svg width="44" height="44" viewBox="0 0 44 44">
                  ${document.querySelector('.qr svg')?.innerHTML || ''}
                </svg>
              </div>
            </div>
            
            <!-- VERSO POUR L'IMPRESSION (PAGE SUIVANTE) -->
            <div style="page-break-before: always;"></div>
            
            <div class="card">
              <table>
                <tbody>
                  <tr>
                    <th>Marque et type</th>
                    <td>${data.marque} - ${data.type_engin}</td>
                  </tr>
                  <tr>
                    <th>Usage</th>
                    <td>${data.usage}</td>
                  </tr>
                  <tr>
                    <th>N. chassis</th>
                    <td>${data.numero_chassis || '-'}</td>
                  </tr>
                  <tr>
                    <th>N. moteur</th>
                    <td>${data.numero_moteur || '-'}</td>
                  </tr>
                  <tr>
                    <th>Année de fabrication</th>
                    <td>${data.annee_fabrication || '-'}</td>
                  </tr>
                  <tr>
                    <th>Couleur</th>
                    <td>${data.couleur || '-'}</td>
                  </tr>
                  <tr>
                    <th>Puissance fiscal</th>
                    <td>${data.puissance_fiscal || '-'}</td>
                  </tr>
                </tbody>
              </table>

              <div class="sig-wrap">
                <div class="signature-box">Signature</div>
              </div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => {
                  window.close();
                }, 100);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête fixe */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Impression de la Carte Rose
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Imprimer
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Instructions :</strong> Cliquez sur la carte pour voir le verso. Cliquez sur "Imprimer" pour lancer l'impression.
            </p>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {/* Zone d'impression */}
          <div ref={printRef} className="print-area">
            <style>
              {`
                .stage { 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  padding: 20px; 
                  box-sizing: border-box; 
                  background: #fff;
                  min-height: auto;
                }

                .card {
                  width: 86mm;
                  height: 54mm;
                  perspective: 1000mm;
                  -webkit-perspective: 1000mm;
                  cursor: pointer;
                  margin: 0 auto;
                }

                .flip {
                  width: 100%; 
                  height: 100%; 
                  position: relative; 
                  transform-style: preserve-3d; 
                  transition: transform 0.8s cubic-bezier(.2,.9,.3,1);
                }

                .card.flipped .flip { 
                  transform: rotateY(180deg); 
                }

                .face {
                  position: absolute; 
                  inset: 0; 
                  backface-visibility: hidden; 
                  -webkit-backface-visibility: hidden;
                  box-sizing: border-box; 
                  border-radius: 1mm; 
                  overflow: hidden;
                  border: 0.5mm solid #000; 
                  background: #fff;
                  display: flex; 
                  align-items: center; 
                  justify-content: center;
                  padding: 2.5mm;
                  font-family: Arial, sans-serif;
                }

                .back { 
                  transform: rotateY(180deg); 
                }

                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  font-size: 2.8mm; 
                }
                
                td, th { 
                  padding: 1mm; 
                  text-align: left; 
                  vertical-align: middle; 
                  border-bottom: 0.2mm solid #eee;
                }
                
                th { 
                  width: 45%; 
                  font-weight: 700; 
                  font-size: 3.0mm; 
                }
                
                td { 
                  width: 55%; 
                  font-weight: 500; 
                }

                .plaque-number {
                  font-weight: bold;
                  font-size: 3.2mm;
                  color: #dc2626;
                }

                .qr { 
                  position: absolute; 
                  right: 2.5mm; 
                  bottom: 2.5mm; 
                  width: 12mm; 
                  height: 12mm; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center;
                  border: 0.2mm solid #000;
                  padding: 0.5mm;
                  background: white;
                }

                .sig-wrap { 
                  position: absolute; 
                  right: 2.5mm; 
                  bottom: 2.5mm; 
                  width: 28mm; 
                  height: 10mm; 
                  display: flex; 
                  align-items: flex-end; 
                  justify-content: center; 
                }
                
                .signature-box { 
                  width: 100%; 
                  border-top: 0.2mm dashed rgba(0,0,0,0.6); 
                  padding-top: 1.5mm; 
                  font-size: 2.4mm; 
                  text-align: center; 
                }

                .hint { 
                  position: absolute; 
                  top: 6px; 
                  left: 8px; 
                  font-size: 10px; 
                  color: #222; 
                  opacity: 0.8; 
                  z-index: 10;
                }
              `}
            </style>

            <div className="stage">
              <div 
                className={`card ${isFlipped ? 'flipped' : ''}`} 
                onClick={toggleFlip}
                role="button" 
                aria-label="Carte 86 par 54 millimètres recto verso" 
                tabIndex={0}
              >
                <div className="hint">Cliquez pour retourner la carte</div>

                <div className="flip">
                  {/* RECTO */}
                  <div className="face front" aria-hidden={isFlipped}>
                    <table>
                      <tbody>
                        <tr>
                          <th>Nom / Raison sociale</th>
                          <td>{data.nom} {data.prenom}</td>
                        </tr>
                        <tr>
                          <th>Adresse physique</th>
                          <td>{data.adresse}</td>
                        </tr>
                        <tr>
                          <th>N.Impôt</th>
                          <td>{data.nif}</td>
                        </tr>
                        <tr>
                          <th>Année de mise en circulation</th>
                          <td>{data.annee_circulation}</td>
                        </tr>
                        <tr>
                          <th>N. Plaque</th>
                          <td className="plaque-number">
                            {data.numero_plaque}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* QR Code avec QRCodeSVG */}
                    <div className="qr" aria-hidden={isFlipped} title="QR code">
                      <QRCodeSVG 
                        value={data.numero_plaque} 
                        size={44}
                        level="H"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    </div>
                  </div>

                  {/* VERSO */}
                  <div className="face back" aria-hidden={!isFlipped}>
                    <table>
                      <tbody>
                        <tr>
                          <th>Marque et type</th>
                          <td>{data.marque} - {data.type_engin}</td>
                        </tr>
                        <tr>
                          <th>Usage</th>
                          <td>{data.usage}</td>
                        </tr>
                        <tr>
                          <th>N. chassis</th>
                          <td>{data.numero_chassis || '-'}</td>
                        </tr>
                        <tr>
                          <th>N. moteur</th>
                          <td>{data.numero_moteur || '-'}</td>
                        </tr>
                        <tr>
                          <th>Année de fabrication</th>
                          <td>{data.annee_fabrication || '-'}</td>
                        </tr>
                        <tr>
                          <th>Couleur</th>
                          <td>{data.couleur || '-'}</td>
                        </tr>
                        <tr>
                          <th>Puissance fiscal</th>
                          <td>{data.puissance_fiscal || '-'}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Signature */}
                    <div className="sig-wrap" aria-hidden={!isFlipped}>
                      <div className="signature-box">Signature</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}