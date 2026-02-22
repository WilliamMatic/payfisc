// src/app/activity/(users)/reimpression/components/PrintModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Printer, RefreshCw, AlertCircle, User, Car, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { formatPlaque } from "../../operations/utils/formatPlaque";
import { mettreAJourStatusCarte } from "@/services/cartes-reprint/cartesReprintService";
import { CarteReprint } from "../types";

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  carte: CarteReprint;
  utilisateur: any;
  onPrintSuccess: (carteId: number) => void;
}

export default function PrintModal({
  isOpen,
  onClose,
  carte,
  onPrintSuccess,
  utilisateur,
}: PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  const getCurrentDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const generateDGRKACode = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const element = utilisateur?.site_code || "Carte";
    return `${element}/${month}/${year}/${carte.id}`;
  };

  const handlePrint = async () => {
    if (printRef.current) {
      setIsPrinting(true);
      setPrintError(null);

      try {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error(
            "Impossible d'ouvrir la fenêtre d'impression. Vérifiez votre bloqueur de fenêtres popup.",
          );
        }

        const qrElement = document.querySelector(".qr-code-canvas canvas");
        const qrDataUrl = qrElement
          ? (qrElement as HTMLCanvasElement).toDataURL()
          : "";

        const printContent = `
<!DOCTYPE html>
<html>
  <head>
    <title>Réimpression - ${carte.numero_plaque}</title>
    <style>
      @page { size: auto; margin: 0; }
      body { margin: 0; padding: 10mm; background: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 70vh; box-sizing: border-box; }
      .card { width: 86mm; border-radius: 1mm; padding: 2.5mm; box-sizing: border-box; position: relative; top: 38px; background: #fff; }
      table { width: 100%; border-collapse: collapse; font-size: 2.2mm; }
      td, th { padding: 0.8mm; text-align: left; vertical-align: middle; border-bottom: 0.15mm solid #eee; }
      th { width: 45%; font-weight: 700; font-size: 2.4mm; }
      td { width: 55%; font-weight: bolder; }
      .plaque-number { font-weight: bold; font-size: 2.6mm; color: #dc2626; }
      .qr { position: absolute; right: 7mm; bottom: 8mm; width: 13mm; height: 13mm; display: flex; align-items: center; justify-content: center; border: none; padding: 0; background: transparent; }
      .qr img { width: 100%; height: 100%; object-fit: contain; }
      .sig-wrap { position: absolute; right: 2mm; bottom: -2mm; width: 25mm; height: 9mm; display: flex; align-items: flex-end; justify-content: center; }
      .signature-box { width: 100%; border-top: 0.15mm dashed rgba(255,255,255,0.0); padding-top: 1mm; font-size: 2mm; text-align: center; }
      .page-break { page-break-after: always; break-after: page; }
      .instruction { width: 86mm; text-align: center; font-size: 2.5mm; color: #666; margin: 3mm 0; padding: 1.5mm; background: #f9f9f9; }
      @media print { body { padding: 5mm; } .instruction { display: none; } }
    </style>
  </head>
  <body>
    <div class="card" style="height: 40mm !important;">
      <div style="position: absolute;top: 0;left: 0;right: 0;display: flex;justify-content: center;align-items: center;">
        <span style="font-size: .5em;">${generateDGRKACode()}</span>
      </div>
      <table>
        <tbody>
          <tr><th></th><td style="position: relative; top: 3px;text-transform: uppercase;font-weight: normal !important;">${carte.nom_proprietaire}</td></tr>
          <tr><th></th><td style="position: relative; top: 4px;text-transform: uppercase;font-weight: normal !important;">${carte.adresse_proprietaire || ""}</td></tr>
          <tr style="position: relative; top: 8px;"><th></th><td style="position: relative; top: 8px;text-transform: uppercase;font-weight: normal !important;"></td></tr>
          <tr><th style="position: relative; top: 9px;"></th><td style="position: relative; top: ${carte.adresse_proprietaire && carte.adresse_proprietaire.length > 33 ? "13px" : "24px"};text-transform: uppercase;">${carte.annee_mise_circulation}</td></tr>
          <tr style="position: relative; top: 23px;"><th></th><td style="position: relative; top: ${carte.adresse_proprietaire && carte.adresse_proprietaire.length > 33 ? "2px" : "14px"};text-transform: uppercase;" class="plaque-number">${utilisateur?.province_code || ""} ${formatPlaque(carte.numero_plaque) || ""}</td></tr>
        </tbody>
      </table>
      <div class="qr">${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ""}<span style="position: absolute;bottom: -20px;font-size: .5em;font-weight: bold;">${getCurrentDate()}</span></div>
    </div>
    <div class="card" style="height: 40mm;margin-top: 30px;">
      <table>
        <tbody>
          <tr style="position: relative; top: -11px;"><th></th><td style="text-transform: uppercase;">${carte.marque_vehicule || ""}</td></tr>
          <tr style="position: relative; top: -17px;"><th></th><td style="text-transform: uppercase;">${carte.usage_vehicule || ""}</td></tr>
          <tr style="position: relative; top: -23px;"><th></th><td style="text-transform: uppercase;">${carte.numero_chassis || "-"}</td></tr>
          <tr style="position: relative; top: -29px;"><th></th><td style="text-transform: uppercase;">${carte.numero_moteur || "-"}</td></tr>
          <tr style="position: relative; top: -33px;"><th></th><td style="text-transform: uppercase;">${carte.annee_fabrication || "-"}</td></tr>
          <tr style="position: relative; top: -38px;"><th></th><td style="text-transform: uppercase;">${carte.couleur_vehicule || "-"}</td></tr>
          <tr style="position: relative; top: -43px;"><th></th><td style="text-transform: uppercase;">${carte.puissance_vehicule || "-"}</td></tr>
        </tbody>
      </table>
      <div class="sig-wrap"><div class="signature-box"><img src="https://willyaminsi.com/signature-fixe.jpg" width="70" height="50" style="position: relative;top: 0px;"></div></div>
    </div>
    <script>window.onload = function() { setTimeout(() => { window.print(); }, 300); };</script>
  </body>
</html>
`;

        printWindow.document.write(printContent);
        printWindow.document.close();

        if (carte.status === 0) {
          try {
            const result = await mettreAJourStatusCarte(carte.id_primaire);
            if (result.status === "success") {
              onPrintSuccess(carte.id);
            } else {
              throw new Error(
                result.message || "Erreur lors de la mise à jour du statut",
              );
            }
          } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:", error);
            setPrintError(
              error instanceof Error
                ? error.message
                : "Erreur lors de la mise à jour du statut",
            );
          }
        }
      } catch (error) {
        console.error("Erreur d'impression:", error);
        setPrintError(
          error instanceof Error
            ? error.message
            : "Erreur lors de l'impression",
        );
      } finally {
        setIsPrinting(false);
      }
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Réimpression de la Carte Rose
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isPrinting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Impression...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Imprimer</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Propriétaire:</span>
              <span className="text-gray-700">{carte.nom_proprietaire}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Car className="w-4 h-4 text-green-600" />
              <span className="font-medium">Plaque:</span>
              <span className="text-red-600 font-bold">
                {carte.numero_plaque}
              </span>
            </div>
          </div>

          {printError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">
                    Erreur d'impression
                  </p>
                  <p className="text-red-600 text-sm">{printError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div
            className="qr-code-canvas"
            style={{ position: "absolute", left: "-9999px" }}
          >
            <QRCodeCanvas
              value={carte.numero_plaque}
              size={128}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>

          <div ref={printRef} className="print-area">
            <style>
              {`
                .stage { display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; background: #fff; min-height: auto; }
                .card { width: 86mm; height: 54mm; perspective: 1000mm; -webkit-perspective: 1000mm; cursor: pointer; margin: 0 auto; }
                .flip { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(.2,.9,.3,1); }
                .card.flipped .flip { transform: rotateY(180deg); }
                .face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; box-sizing: border-box; border-radius: 1mm; overflow: hidden; border: 0.5mm solid #000; background: #fff; display: flex; align-items: center; justify-content: center; padding: 2.5mm; font-family: Arial, sans-serif; }
                .back { transform: rotateY(180deg); }
                table { width: 100%; border-collapse: collapse; font-size: 2.2mm; }
                td, th { padding: 0.8mm; text-align: left; vertical-align: middle; border-bottom: 0.15mm solid #eee; }
                th { width: 45%; font-weight: 700; font-size: 2.4mm; }
                td { width: 55%; font-weight: 500; }
                .plaque-number { font-weight: bold; font-size: 2.6mm; color: #dc2626; }
                .qr { position: absolute; right: 2mm; bottom: 2mm; width: 11mm; height: 11mm; display: flex; align-items: center; justify-content: center; border: 0.15mm solid #000; padding: 0.4mm; background: white; }
                .sig-wrap { position: absolute; right: 2mm; bottom: 2mm; width: 25mm; height: 9mm; display: flex; align-items: flex-end; justify-content: center; }
                .signature-box { width: 100%; border-top: 0.15mm dashed rgba(0,0,0,0.6); padding-top: 1mm; font-size: 2mm; text-align: center; }
                .hint { position: absolute; top: 6px; left: 8px; font-size: 10px; color: #222; opacity: 0.8; z-index: 10; }
                .dgrka-code { position: absolute; top: 2mm; left: 0; right: 0; display: flex; justify-content: center; align-items: center; font-size: 1.8mm; font-weight: bold; }
              `}
            </style>

            <div className="stage">
              <div
                className={`card ${isFlipped ? "flipped" : ""}`}
                onClick={toggleFlip}
                role="button"
                aria-label="Carte 86 par 54 millimètres recto verso"
                tabIndex={0}
              >
                <div className="hint">Cliquez pour retourner la carte</div>
                <div className="flip">
                  <div className="face front" aria-hidden={isFlipped}>
                    <div className="dgrka-code">{generateDGRKACode()}</div>
                    <table>
                      <tbody>
                        <tr>
                          <th>Nom / Raison sociale</th>
                          <td>{carte.nom_proprietaire}</td>
                        </tr>
                        <tr>
                          <th>Adresse physique</th>
                          <td>{carte.adresse_proprietaire || ""}</td>
                        </tr>
                        <tr>
                          <th>NIF</th>
                          <td>{carte.nif_proprietaire || ""}</td>
                        </tr>
                        <tr>
                          <th>Année de mise en circulation</th>
                          <td>{carte.annee_mise_circulation}</td>
                        </tr>
                        <tr>
                          <th>N. Plaque</th>
                          <td className="plaque-number">
                            {formatPlaque(carte.numero_plaque)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="qr" aria-hidden={isFlipped} title="QR code">
                      <QRCodeCanvas
                        value={carte.numero_plaque}
                        size={40}
                        level="H"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-4mm",
                          fontSize: "1.6mm",
                          fontWeight: "bold",
                        }}
                      >
                        {getCurrentDate()}
                      </span>
                    </div>
                  </div>
                  <div className="face back" aria-hidden={!isFlipped}>
                    <table>
                      <tbody>
                        <tr>
                          <th>Marque</th>
                          <td>{carte.marque_vehicule || "-"}</td>
                        </tr>
                        <tr>
                          <th>Usage</th>
                          <td>{carte.usage_vehicule || "-"}</td>
                        </tr>
                        <tr>
                          <th>N. chassis</th>
                          <td>{carte.numero_chassis || "-"}</td>
                        </tr>
                        <tr>
                          <th>N. moteur</th>
                          <td>{carte.numero_moteur || "-"}</td>
                        </tr>
                        <tr>
                          <th>Année de fabrication</th>
                          <td>{carte.annee_fabrication || "-"}</td>
                        </tr>
                        <tr>
                          <th>Couleur</th>
                          <td>{carte.couleur_vehicule || "-"}</td>
                        </tr>
                        <tr>
                          <th>Puissance</th>
                          <td>{carte.puissance_vehicule || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="sig-wrap" aria-hidden={!isFlipped}>
                      <div className="signature-box">
                        SERVICE DE LA CARTE ROSE
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-blue-50 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Instructions importantes :</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Cliquez sur la carte pour voir le recto et le verso</li>
                <li>Cliquez sur "Imprimer" pour générer les deux pages</li>
                <li>
                  Imprimez le recto sur une face, retournez la feuille, imprimez
                  le verso
                </li>
                {carte.status === 0 && (
                  <li>
                    Le statut passera automatiquement à "Imprimé" après
                    impression
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
