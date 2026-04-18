// src/app/activity/(users)/reimpression/components/MultiPrintModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Printer, CheckCircle, X, AlertCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { formatPlaque } from "../../operations/utils/formatPlaque";
import { mettreAJourStatusCarte } from "@/services/cartes-reprint/cartesReprintService";
import { CarteReprint } from "../types";

interface MultiPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartes: CarteReprint[];
  utilisateur: any;
  onPrintSuccess: (carteIds: number[]) => void;
}

type Phase = "ready" | "processing" | "done" | "error";

export default function MultiPrintModal({
  isOpen,
  onClose,
  cartes,
  utilisateur,
  onPrintSuccess,
}: MultiPrintModalProps) {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processingRef = useRef(false);

  const total = cartes.length;
  const remaining = total - currentIndex;
  const progress = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  useEffect(() => {
    if (isOpen) {
      setPhase("ready");
      setCurrentIndex(0);
      setErrorMessage(null);
      processingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "processing") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, phase]);

  const getCurrentDate = () => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  };

  const generateDGRKACode = (carte: CarteReprint) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${utilisateur?.site_code || "Carte"}/${month}/${year}/${carte.id}`;
  };

  const getQRValue = (carte: CarteReprint) =>
    [
      carte.nom_proprietaire,
      carte.adresse_proprietaire,
      `${carte.marque_vehicule}`,
      carte.numero_plaque,
      carte.numero_chassis,
      carte.couleur_vehicule,
      carte.usage_vehicule
    ].filter(Boolean).join("\n");

  const getQRDataUrl = (carteIdPrimaire: number): string => {
    if (!qrContainerRef.current) return "";
    const wrapper = qrContainerRef.current.querySelector(`[data-id="${carteIdPrimaire}"]`);
    const canvas = wrapper?.querySelector("canvas");
    return canvas ? (canvas as HTMLCanvasElement).toDataURL() : "";
  };

  const generateCardPairHTML = (carte: CarteReprint, qrDataUrl: string): string => {
    const isAvecTemplate = utilisateur?.template_carte_actuel;

    const signatureImg = isAvecTemplate
      ? `<img 
  src="${utilisateur?.site_code === "DGRSA" 
    ? "https://willyaminsi.com/signature-sankuru.png" 
    : "https://willyaminsi.com/signature-fixe.jpg"}"
  style="
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    position: relative;
    top: 7px;
    left: 5px;
    image-rendering: crisp-edges;
  "
>`
      : `<img src="${utilisateur?.site_code === "DGRSA" ? "https://willyaminsi.com/signature-sankuru.png" : "https://willyaminsi.com/signature-fixe.jpg"}" width="70" height="50" style="position: relative;top: 0px;">`;

    // Front card positions differ between avec/sans template
    const adresseTop = isAvecTemplate ? "3px" : "4px";
    const anneeTop = carte.adresse_proprietaire && carte.adresse_proprietaire.length > 33
      ? (isAvecTemplate ? "10px" : "13px")
      : (isAvecTemplate ? "20px" : "24px");
    const anneeExtra = isAvecTemplate ? "left: 10px;" : "";
    const plaqueTop = carte.adresse_proprietaire && carte.adresse_proprietaire.length > 33
      ? (isAvecTemplate ? "-2px" : "2px")
      : (isAvecTemplate ? "9px" : "14px");

    const frontCard = `
    <div class="card" style="height: 40mm !important;">
      <div style="position: absolute;top: 0;left: 0;right: 0;display: flex;justify-content: center;align-items: center;">
        <span style="font-size: .5em;">${generateDGRKACode(carte)}</span>
      </div>
      <table>
        <tbody>
          <tr><th></th><td style="position: relative; top: 3px;text-transform: uppercase;font-weight: normal !important;">${carte.nom_proprietaire}</td></tr>
          <tr><th></th><td style="position: relative; top: ${adresseTop};text-transform: uppercase;font-weight: normal !important;">${carte.adresse_proprietaire || ""}</td></tr>
          <tr style="position: relative; top: 8px;"><th></th><td style="position: relative; top: 8px;text-transform: uppercase;font-weight: normal !important;"></td></tr>
          <tr><th style="position: relative; top: 9px;"></th><td style="position: relative; top: ${anneeTop};text-transform: uppercase;${anneeExtra}">${carte.annee_mise_circulation}</td></tr>
          <tr style="position: relative; top: 23px;"><th></th><td style="position: relative; top: ${plaqueTop};text-transform: uppercase;" class="plaque-number">${utilisateur?.province_code || ""} ${formatPlaque(carte.numero_plaque) || ""}</td></tr>
        </tbody>
      </table>
      <div class="qr">${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ""}<span style="position: absolute;bottom: -20px;font-size: .5em;font-weight: bold;">${getCurrentDate()}</span></div>
    </div>`;

    const backPositions = isAvecTemplate
      ? ["-14px", "-19px", "-23px", "-28px", "-33px", "-37px", "-42px"]
      : ["-11px", "-17px", "-23px", "-29px", "-33px", "-38px", "-43px"];

    const backCard = `
    <div class="card" style="height: 40mm;margin-top: 30px;">
      <table>
        <tbody>
          <tr style="position: relative; top: ${backPositions[0]};"><th></th><td style="text-transform: uppercase;">${carte.marque_vehicule || ""}</td></tr>
          <tr style="position: relative; top: ${backPositions[1]};"><th></th><td style="text-transform: uppercase;">${carte.usage_vehicule || ""}</td></tr>
          <tr style="position: relative; top: ${backPositions[2]};"><th></th><td style="text-transform: uppercase;">${carte.numero_chassis || "-"}</td></tr>
          <tr style="position: relative; top: ${backPositions[3]};"><th></th><td style="text-transform: uppercase;">${carte.numero_moteur || "-"}</td></tr>
          <tr style="position: relative; top: ${backPositions[4]};"><th></th><td style="text-transform: uppercase;">${carte.annee_fabrication || "-"}</td></tr>
          <tr style="position: relative; top: ${backPositions[5]};"><th></th><td style="text-transform: uppercase;">${carte.couleur_vehicule || "-"}</td></tr>
          <tr style="position: relative; top: ${backPositions[6]};"><th></th><td style="text-transform: uppercase;">${carte.puissance_vehicule || "-"}</td></tr>
        </tbody>
      </table>
      <div class="sig-wrap"><div class="signature-box">${signatureImg}</div></div>
    </div>`;

    return frontCard + backCard;
  };

  const startMultiPrint = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setPhase("processing");
    setCurrentIndex(0);

    try {
      // Wait for QR canvases to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const cardsHTML: string[] = [];
      const printedCarteIds: number[] = [];

      for (let i = 0; i < cartes.length; i++) {
        const carte = cartes[i];

        // Generate HTML for this card
        const qrDataUrl = getQRDataUrl(carte.id_primaire);
        cardsHTML.push(generateCardPairHTML(carte, qrDataUrl));

        // Add page break between cards (not after the last one)
        if (i < cartes.length - 1) {
          cardsHTML.push('<div class="page-break"></div>');
        }

        // Update status if needed
        if (carte.status === 0) {
          try {
            const result = await mettreAJourStatusCarte(carte.id_primaire);
            if (result.status === "success") {
              printedCarteIds.push(carte.id);
            }
          } catch (err) {
            console.error(`Erreur mise à jour carte ${carte.id}:`, err);
          }
        } else {
          // Small delay for cards already printed so UI counter updates visibly
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setCurrentIndex(i + 1);
      }

      // Build full print document with exact same CSS as PrintModal
      const isAvecTemplate = utilisateur?.template_carte_actuel;
      const qrRight = isAvecTemplate ? "6mm" : "7mm";
      const qrBottom = isAvecTemplate ? "9.8mm" : "8mm";
      const cssStyle = `
      @page { size: auto; margin: 0; }
      body { margin: 0; padding: 10mm; background: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 70vh; box-sizing: border-box; }
      .card { width: 86mm; border-radius: 1mm; padding: 2.5mm; box-sizing: border-box; position: relative; top: 38px; background: #fff; }
      table { width: 100%; border-collapse: collapse; font-size: 2.2mm; }
      td, th { padding: 0.8mm; text-align: left; vertical-align: middle; border-bottom: 0.15mm solid #eee; }
      th { width: 45%; font-weight: 700; font-size: 2.4mm; }
      td { width: 55%; font-weight: bolder; }
      .plaque-number { font-weight: bold; font-size: 2.6mm; color: #dc2626; }
      .qr { position: absolute; right: ${qrRight}; bottom: ${qrBottom}; width: 13mm; height: 13mm; display: flex; align-items: center; justify-content: center; border: none; padding: 0; background: transparent; }
      .qr img { width: 100%; height: 100%; object-fit: contain; }
      .sig-wrap { position: absolute; right: 2mm; bottom: -2mm; width: 25mm; height: 9mm; display: flex; align-items: flex-end; justify-content: center; }
      .signature-box { width: 100%; border-top: 0.15mm dashed rgba(255,255,255,0.0); padding-top: 1mm; font-size: 2mm; text-align: center; }
      .page-break { page-break-after: always; break-after: page; }
      .instruction { width: 86mm; text-align: center; font-size: 2.5mm; color: #666; margin: 3mm 0; padding: 1.5mm; background: #f9f9f9; }
      @media print { body { padding: 5mm; } .instruction { display: none; } }`;

      const fullHTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Impression groupée - ${cartes.length} cartes</title>
    <style>${cssStyle}</style>
  </head>
  <body>
    ${cardsHTML.join("\n")}
    <script>window.onload = function() { setTimeout(() => { window.print(); }, 300); };</script>
  </body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Impossible d'ouvrir la fenêtre d'impression. Vérifiez votre bloqueur de fenêtres popup.");
      }
      printWindow.document.write(fullHTML);
      printWindow.document.close();

      if (printedCarteIds.length > 0) {
        onPrintSuccess(printedCarteIds);
      }

      setPhase("done");
    } catch (error) {
      console.error("Erreur impression multiple:", error);
      setErrorMessage(error instanceof Error ? error.message : "Erreur lors de l'impression");
      setPhase("error");
    } finally {
      processingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Hidden QR codes */}
      <div ref={qrContainerRef} style={{ position: "absolute", left: "-9999px" }}>
        {cartes.map((carte) => (
          <div key={carte.id_primaire} data-id={carte.id_primaire}>
            <QRCodeCanvas value={getQRValue(carte)} size={128} level="L" bgColor="#FFFFFF" fgColor="#000000" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#2D5B7A]/10 rounded-xl flex items-center justify-center">
                <Printer className="w-5 h-5 text-[#2D5B7A]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Impression groupée</h3>
                <p className="text-sm text-gray-500">{total} carte{total > 1 ? "s" : ""} sélectionnée{total > 1 ? "s" : ""}</p>
              </div>
            </div>
            {phase !== "processing" && (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* READY */}
          {phase === "ready" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2D5B7A]/10 rounded-full">
                <Printer className="w-10 h-10 text-[#2D5B7A]" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  {total} carte{total > 1 ? "s" : ""} prête{total > 1 ? "s" : ""} à imprimer
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  L&apos;impression s&apos;enchaînera automatiquement
                </p>
              </div>
              <button
                onClick={startMultiPrint}
                className="w-full px-6 py-3 bg-[#2D5B7A] text-white rounded-xl hover:bg-[#244D68] transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Printer className="w-5 h-5" />
                <span>Lancer l&apos;impression groupée</span>
              </button>
            </div>
          )}

          {/* PROCESSING */}
          {phase === "processing" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-xs text-orange-600 uppercase tracking-wider font-medium mb-1">Restantes</p>
                  <p className="text-3xl font-bold text-orange-600">{remaining}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 uppercase tracking-wider font-medium mb-1">En cours</p>
                  <p className="text-lg font-bold text-blue-600">
                    {currentIndex < total ? `Carte #${currentIndex + 1}/${total}` : `${total}/${total}`}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 uppercase tracking-wider font-medium mb-1">Terminé</p>
                  <p className="text-3xl font-bold text-green-600">{currentIndex}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progression</span>
                  <span className="font-bold text-[#2D5B7A]">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#2D5B7A] to-[#3d7ba0] h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {currentIndex < total && (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#2D5B7A] border-t-transparent flex-shrink-0" />
                  <div className="text-sm min-w-0">
                    <p className="font-medium text-gray-900 truncate">{cartes[currentIndex]?.nom_proprietaire}</p>
                    <p className="text-gray-500">{formatPlaque(cartes[currentIndex]?.numero_plaque || "")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {phase === "done" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">Impression terminée !</p>
                <p className="text-gray-500 mt-1">
                  {total} carte{total > 1 ? "s" : ""} envoyée{total > 1 ? "s" : ""} à l&apos;impression
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          )}

          {/* ERROR */}
          {phase === "error" && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">Erreur</p>
                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => { setPhase("ready"); setCurrentIndex(0); setErrorMessage(null); }}
                  className="flex-1 px-6 py-3 bg-[#2D5B7A] text-white rounded-xl hover:bg-[#244D68] transition-colors font-medium"
                >
                  Réessayer
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
