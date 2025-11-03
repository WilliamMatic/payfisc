"use client";
import { useRef, useEffect, useState } from "react";
import { QRCodeCanvas } from 'qrcode.react';

interface PrintData {
  nom: string;
  prenom: string;
  adresse: string;
  nif: string;
  numero_plaque: string;
  annee_circulation: string;
  marque: string;
  type_engin: string;
  usage_engin: string;
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

      // Récupérer le QR Code SVG
      const qrElement = document.querySelector('.qr-code-canvas canvas');
      const qrDataUrl = qrElement ? (qrElement as HTMLCanvasElement).toDataURL() : '';

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
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                min-height: 70vh;
                box-sizing: border-box;
              }
              
              /* TAILLE EXACTE 86mm × 54mm pour l'impression */
              .card {
                width: 86mm;
                border-radius: 1mm;
                padding: 2.5mm;
                box-sizing: border-box;
                position: relative;
                top: 38px;
                background: #fff;
              }
              
              table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 2.2mm; 
              }
              
              td, th { 
                padding: 0.8mm; 
                text-align: left; 
                vertical-align: middle; 
                border-bottom: 0.15mm solid #eee;
              }
              
              th { 
                width: 45%; 
                font-weight: 700; 
                font-size: 2.4mm; 
              }
              
              td { 
                width: 55%; 
                font-weight: bolder; 
              }

              .plaque-number {
                font-weight: bold;
                font-size: 2.6mm;
                color: #dc2626;
              }

              .qr { 
                position: absolute; 
                right: 7mm; 
                bottom: 8mm; 
                width: 13mm; 
                height: 13mm; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                border: none;
                padding: 0;
                background: transparent;
              }

              .qr img {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }

              .sig-wrap { 
                position: absolute; 
                right: 2mm; 
                bottom: -2mm; 
                width: 25mm; 
                height: 9mm; 
                display: flex; 
                align-items: flex-end; 
                justify-content: center; 
              }
              
              .signature-box { 
                width: 100%; 
                border-top: 0.15mm dashed rgba(0,0,0,0.6); 
                padding-top: 1mm; 
                font-size: 2mm; 
                text-align: center; 
              }

              /* Force le saut de page après le recto */
              .page-break {
                page-break-after: always;
                break-after: page;
              }

              .instruction {
                width: 86mm;
                text-align: center;
                font-size: 2.5mm;
                color: #666;
                margin: 3mm 0;
                padding: 1.5mm;
                border: 0.15mm dashed #999;
                background: #f9f9f9;
              }

              @media print {
                body {
                  padding: 5mm;
                }
                .instruction {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <!-- RECTO (PAGE 1) -->
            <div class="card" style="height: 40mm !important;">
              <table>
                <tbody>
                  <tr>
                    <th></th>
                    <td style="position: relative; top: 1px;">${data.nom} ${data.prenom}</td>
                  </tr>
                  <tr>
                    <th></th>
                    <td style="position: relative; top: 1px;">${data.adresse}</td>
                  </tr>
                  <tr style="position: relative; top: 8px;">
                    <th></th>
                    <td></td>
                  </tr>
                  <tr>
                    <th style="position: relative; top: 9px;"></th>
                    <td style="position: relative; top: 24px;">${data.annee_circulation}</td>
                  </tr>
                  <tr style="position: relative; top: 23px;">
                    <th></th>
                    <td style="position: relative; top: 14px;" class="plaque-number">${data.numero_plaque}</td>
                  </tr>
                </tbody>
              </table>
              
              <div class="qr">
                ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ''}
              </div>
            </div>

            <div class="instruction">
              ↑ RECTO - Imprimez cette face en premier
            </div>
            
            <!-- SAUT DE PAGE FORCÉ -->
            <div class="page-break"></div>
            
            <div class="instruction">
              ↓ VERSO - Retournez la feuille et réinsérez-la pour imprimer le verso
            </div>

            <!-- VERSO (PAGE 2) -->
            <div class="card" style="height: 40mm;">
              <table>
                <tbody>
                  <tr style="position: relative; top: -11px;">
                    <th></th>
                    <td>${data.marque} - ${data.type_engin}</td>
                  </tr>
                  <tr style="position: relative; top: -17px;">
                    <th></th>
                    <td>${data.usage_engin}</td>
                  </tr>
                  <tr style="position: relative; top: -23px;">
                    <th></th>
                    <td>${data.numero_chassis || '-'}</td>
                  </tr>
                  <tr style="position: relative; top: -29px;">
                    <th></th>
                    <td>${data.numero_moteur || '-'}</td>
                  </tr>
                  <tr style="position: relative; top: -33px;">
                    <th></th>
                    <td>${data.annee_fabrication || '-'}</td>
                  </tr>
                  <tr style="position: relative; top: -38px;">
                    <th></th>
                    <td>${data.couleur || '-'}</td>
                  </tr>
                  <tr style="position: relative; top: -43px;">
                    <th></th>
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
                // Attendre un peu pour s'assurer que tout est chargé
                setTimeout(() => {
                  window.print();
                }, 300);
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
              <strong>Instructions d'impression recto-verso :</strong>
            </p>
            <ul className="text-blue-700 text-sm mt-2 ml-4 list-disc space-y-1">
              <li>Cliquez sur "Imprimer" pour ouvrir la fenêtre d'impression</li>
              <li>Le recto s'imprimera sur la page 1</li>
              <li>Retournez la feuille et réinsérez-la dans l'imprimante</li>
              <li>Le verso s'imprimera sur la page 2 (au dos du recto)</li>
              <li>Cliquez sur la carte ci-dessous pour prévisualiser le recto et le verso</li>
            </ul>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {/* Zone d'impression cachée pour le QR Code */}
          <div className="qr-code-canvas" style={{ position: 'absolute', left: '-9999px' }}>
            <QRCodeCanvas 
              value={data.numero_plaque} 
              size={128}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          {/* Prévisualisation interactive */}
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
                  font-size: 2.2mm; 
                }
                
                td, th { 
                  padding: 0.8mm; 
                  text-align: left; 
                  vertical-align: middle; 
                  border-bottom: 0.15mm solid #eee;
                }
                
                th { 
                  width: 45%; 
                  font-weight: 700; 
                  font-size: 2.4mm; 
                }
                
                td { 
                  width: 55%; 
                  font-weight: 500; 
                }

                .plaque-number {
                  font-weight: bold;
                  font-size: 2.6mm;
                  color: #dc2626;
                }

                .qr { 
                  position: absolute; 
                  right: 2mm; 
                  bottom: 2mm; 
                  width: 11mm; 
                  height: 11mm; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center;
                  border: 0.15mm solid #000;
                  padding: 0.4mm;
                  background: white;
                }

                .sig-wrap { 
                  position: absolute; 
                  right: 2mm; 
                  bottom: 2mm; 
                  width: 25mm; 
                  height: 9mm; 
                  display: flex; 
                  align-items: flex-end; 
                  justify-content: center; 
                }
                
                .signature-box { 
                  width: 100%; 
                  border-top: 0.15mm dashed rgba(0,0,0,0.6); 
                  padding-top: 1mm; 
                  font-size: 2mm; 
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

                    {/* QR Code */}
                    <div className="qr" aria-hidden={isFlipped} title="QR code">
                      <QRCodeCanvas 
                        value={data.numero_plaque} 
                        size={40}
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
                          <td>{data.usage_engin}</td>
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