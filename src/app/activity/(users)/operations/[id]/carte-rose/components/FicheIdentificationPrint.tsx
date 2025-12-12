"use client";
import { useRef, useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface FicheData {
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
  paiement_id?: string;
  modele?: string;
  telephone?: string;
  email?: string;
  date_immatriculation?: string;
}

interface FicheSupplementaire {
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  adresse_complete: string;
  types_document: {
    carte_identite: boolean;
    passeport: boolean;
    permis_conduire: boolean;
    carte_electeur: boolean;
  };
  niup_moto: string;
}

interface FicheIdentificationPrintProps {
  data: FicheData;
  supplementaire?: FicheSupplementaire;
  isOpen: boolean;
  onClose: () => void;
}

export default function FicheIdentificationPrint({
  data,
  supplementaire,
  isOpen,
  onClose,
}: FicheIdentificationPrintProps) {
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Gestion de la date/heure
  useEffect(() => {
    setCurrentDateTime(getDateTime());
    const interval = setInterval(() => {
      setCurrentDateTime(getDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Effet pour générer le QR Code
  useEffect(() => {
    if (!isOpen) return;

    const generateQRCode = () => {
      // Créer les données pour le QR Code
      const qrData = {
        nom: data.nom,
        prenom: data.prenom,
        plaque: data.numero_plaque,
        niup: supplementaire?.niup_moto || "",
        expiration: calculateValidity().expirationDate,
        jours: calculateValidity().remainingDays,
        timestamp: new Date().toISOString(),
        document: "Fiche d'Identification Moto - Holding TSC-NPS SA",
      };

      // Créer un canvas temporaire
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Dessiner un QR Code stylisé
        // Fond blanc
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 256, 256);
        
        // Bordures
        ctx.strokeStyle = "#9f5514";
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 248);
        
        // Dessiner un motif de QR Code simplifié
        ctx.fillStyle = "#000000";
        
        // Grands carrés pour simuler les repères QR
        // Coin supérieur gauche
        ctx.fillRect(20, 20, 56, 56);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(28, 28, 40, 40);
        ctx.fillStyle = "#000000";
        ctx.fillRect(32, 32, 32, 32);
        
        // Coin supérieur droit
        ctx.fillStyle = "#000000";
        ctx.fillRect(180, 20, 56, 56);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(188, 28, 40, 40);
        ctx.fillStyle = "#000000";
        ctx.fillRect(192, 32, 32, 32);
        
        // Coin inférieur gauche
        ctx.fillStyle = "#000000";
        ctx.fillRect(20, 180, 56, 56);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(28, 188, 40, 40);
        ctx.fillStyle = "#000000";
        ctx.fillRect(32, 192, 32, 32);

        // Texte au centre
        ctx.fillStyle = "#000000";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("DOCUMENT", 128, 100);
        ctx.fillText("SÉCURISÉ", 128, 120);
        ctx.font = "12px Arial";
        ctx.fillText(`${data.nom} ${data.prenom}`, 128, 140);
        ctx.fillText(`Plaque: ${data.numero_plaque}`, 128, 155);
        ctx.fillText(`Exp: ${calculateValidity().expirationDate}`, 128, 170);
        ctx.font = "10px Arial";
        ctx.fillText("Holding TSC-NPS SA", 128, 190);

        const dataUrl = canvas.toDataURL("image/png");
        setQrDataUrl(dataUrl);
      }
    };

    generateQRCode();
  }, [data, supplementaire, isOpen]);

  // Fonction pour calculer la validité
  const calculateValidity = () => {
    const dateImmatriculation = data.date_immatriculation
      ? new Date(data.date_immatriculation)
      : new Date();

    const expirationDate = new Date(dateImmatriculation);
    expirationDate.setDate(expirationDate.getDate() + 45);

    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isActive: diffDays > 0 && diffDays <= 45,
      remainingDays: diffDays > 0 ? diffDays : 0,
      expirationDate: expirationDate.toLocaleDateString("fr-FR"),
    };
  };

  const validity = calculateValidity();

  // Formatage de la date de naissance
  const formatDateNaissance = () => {
    if (!supplementaire?.date_naissance) return "";
    const date = new Date(supplementaire.date_naissance);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formatage de la cylindrée
  const formatCylindree = () => {
    if (data.puissance_fiscal) {
      const cv = parseInt(data.puissance_fiscal.replace("CV", "").trim());
      const cc = cv * 15;
      return `${cc}cc / ${data.puissance_fiscal}`;
    }
    return "-----";
  };

  // Méthodes pour les dates
  const getFormattedDate = (format: "full" | "short" | "numbers" = "numbers"): string => {
    const now = new Date();
    switch (format) {
      case "full":
        return now.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      case "short":
        return now.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      case "numbers":
      default:
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
    }
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const getDateTime = (): string => {
    return `${getFormattedDate("numbers")} ${getCurrentTime()}`;
  };

  // Fonction pour générer le QR Code pour l'impression
  const generatePrintQRCode = (): string => {
    // Créer un canvas pour générer le QR Code
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Dessiner un QR Code stylisé
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 256, 256);
      
      // Bordures
      ctx.strokeStyle = "#9f5514";
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 248, 248);
      
      // Dessiner un motif de QR Code simplifié
      ctx.fillStyle = "#000000";
      
      // Grands carrés pour simuler les repères QR
      // Coin supérieur gauche
      ctx.fillRect(20, 20, 56, 56);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(28, 28, 40, 40);
      ctx.fillStyle = "#000000";
      ctx.fillRect(32, 32, 32, 32);
      
      // Coin supérieur droit
      ctx.fillStyle = "#000000";
      ctx.fillRect(180, 20, 56, 56);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(188, 28, 40, 40);
      ctx.fillStyle = "#000000";
      ctx.fillRect(192, 32, 32, 32);
      
      // Coin inférieur gauche
      ctx.fillStyle = "#000000";
      ctx.fillRect(20, 180, 56, 56);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(28, 188, 40, 40);
      ctx.fillStyle = "#000000";
      ctx.fillRect(32, 192, 32, 32);

      // Texte au centre
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("DOCUMENT", 128, 100);
      ctx.fillText("SÉCURISÉ", 128, 120);
      ctx.font = "12px Arial";
      ctx.fillText(`${data.nom} ${data.prenom}`, 128, 140);
      ctx.fillText(`Plaque: ${data.numero_plaque}`, 128, 155);
      ctx.fillText(`Exp: ${validity.expirationDate}`, 128, 170);
      ctx.font = "10px Arial";
      ctx.fillText("Holding TSC-NPS SA", 128, 190);

      return canvas.toDataURL("image/png");
    }
    
    return "";
  };

  const handlePrint = () => {
    // Générer le QR Code pour l'impression
    const printQRCodeUrl = generatePrintQRCode();
    
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const printContent = `
        <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fiche d'identification moto</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');

    *{
      font-family: "Nunito Sans", sans-serif;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 10px;
      background: #f5f5f5;
    }

    .page-a4 {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      margin: auto;
      padding: 10mm 15mm 15mm 15mm;
      background: white;
      border: 1px solid chocolate;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Fond principal qui couvre toute la page */
    .full-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
    }

    .full-background img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.50;
    }

    /* Image d'armoirie au centre */
    .armoirie-center {
      position: absolute;
      top: 50%;
      left: 75%;
      transform: translate(-50%, -50%);
      z-index: 2;
      pointer-events: none;
    }

    .armoirie-center img {
      width: 180px;
      height: auto;
      opacity: 0.15;
    }

    /* Image cachée en bas à droite de l'armoirie */
    .hidden-near-armoirie {
      position: absolute;
      z-index: 2;
      pointer-events: none;
    }

    /* Image de signature sécurisée */
    .secure-signature {
      position: absolute;
      z-index: 3;
      pointer-events: none;
    }

    /* Contenu principal au-dessus des images de fond */
    header, section, footer {
      position: relative;
      z-index: 4;
    }

    header{
      width: 100%;
      height: auto;
      display: flex;
      justify-content: space-between;
      margin-bottom: 5mm;
    }

    header .header__title{
      width: 70%;
      background: #9f5514;
      color: rgba(255, 255, 255, 0.9);
      padding: 8px 15px;
      border-radius: 4px;
    }

    header .header__title h1, header .header__title p{
      padding: 0;
      margin: 0;
      line-height: 1.2;
    }

    header .header__title h1{
      font-size: 1.8em;
      margin-bottom: 3px;
    }

    header .header__title p{
      margin-left: 5px;
      font-size: 0.85em;
    }

    header .header__validity{
      width: 28%;
      position: relative;
      padding-top: 0;
    }

    .validity-box {
      display: flex;
      justify-content: flex-end;
    }

    .validity-content {
      width: 100%;
      border: 1px solid chocolate;
      padding: 6px 8px;
      background: #fff;
      border-radius: 4px;
      text-align: center;
    }

    .validity-content strong {
      display: block;
      font-size: 0.9em;
    }

    .validity-days {
      color: chocolate;
      font-size: 1.1em !important;
      margin-top: 2px;
    }

    .qr-code {
      position: absolute;
      left: 0;
      top: 70px;
      text-align: center;
    }

    .qr-code img {
      width: 90px;
      height: 90px;
      display: block;
      margin: 0 auto 5px;
      border: 1px solid #ddd;
      padding: 5px;
      background: white;
    }

    .qr-code figcaption {
      text-align: center;
      font-size: 0.7em;
      line-height: 1.2;
    }

    section {
      margin-top: 5mm;
    }

    legend {
      display: block;
      width: 100%;
      margin: 15px 0 8px 0;
      padding: 0;
    }

    legend h3 {
      padding: 0;
      margin: 0;
      font-size: 1.1em;
      color: #9f5514;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }

    table tbody tr td{
      padding: 6px 5px;
      vertical-align: top;
    }

    table tbody tr td:first-child{
      width: 160px;
      min-width: 160px;
      font-weight: bold;
      color: #333;
    }

    table tbody tr td:nth-child(2){
      color: #555;
      border-bottom: 1px dotted #ddd;
    }

    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 5px;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      font-size: 0.9em;
      color: #555;
    }

    .checkbox-group input[type="checkbox"] {
      margin-right: 6px;
      transform: scale(1.1);
    }

    .signature-section {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #e0e0e0;
      position: relative;
    }

    .signature-line {
      position: relative;
    }

    .validation-section {
      margin-top: 20px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .validation-section td {
      padding: 4px 0;
      font-size: 0.85em;
      color: #666;
      border: none !important;
    }

    .contact-info {
      text-align: right;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #ddd;
    }

    .contact-info div {
      margin: 3px 0;
    }

    .contact-info span {
      font-size: 0.85em;
    }

    footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #9f5514;
      height: 25px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 -15mm;
      width: calc(100% + 30mm);
      z-index: 4;
    }

    footer p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.75em;
      margin: 0;
      font-weight: bold;
      letter-spacing: 0.5px;
    }

    /* Style pour les lignes vides (placeholder) */
    .placeholder {
      color: #999;
      font-style: italic;
    }

    /* Informations QR Code */
    .qr-info {
      font-size: 0.65em;
      color: #666;
      margin-top: 3px;
      line-height: 1.2;
    }

    /* Ajustements pour l'impression */
    @media print {
      body {
        background: none;
        padding: 0;
        margin: 0;
      }
      
      .page-a4 {
        border: none;
        padding: 10mm 15mm 15mm 15mm;
        margin: 0;
        height: 297mm;
        min-height: 297mm;
        box-shadow: none;
      }
      
      footer {
        margin: 0 -15mm;
        width: calc(100% + 30mm);
      }

      .full-background, .armoirie-center, .hidden-near-armoirie, .secure-signature {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .full-background img {
        opacity: 0.50;
      }

      .armoirie-center img {
        opacity: 0.2;
      }

      .qr-code img {
        border: 1px solid #000 !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      /* Assurer que le QR Code s'imprime bien */
      .qr-code {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <div class="page-a4">
    
    <!-- Fond principal qui couvre toute la page -->
    <div class="full-background">
      <img src="https://willyaminsi.com/fond.png" alt="Fond de page">
    </div>

    <!-- Armoirie au centre -->
    <div class="armoirie-center">
      <img src="https://willyaminsi.com/armoirie.png" alt="Armoirie">
    </div>

    <!-- Image cachée en bas à droite de l'armoirie -->
    <div class="hidden-near-armoirie" style="top: 60%; left: 66%;">
      <img src="https://willyaminsi.com/cache.png" alt="Image cachée" width="150" height="150" style="opacity: .75;">
    </div>

    <header>
      <div class="header__title">
        <h1>
          FICHE D'IDENTIFICATION <br> 
          & IMMATRICULATION MOTO 
        </h1>
        <p>
          Tenant lieu de Carte Rose <br> 
          & Plaque d'immatriculation provisoire 
        </p>
      </div>

      <div class="header__validity">
        <div class="validity-box">
          <div class="validity-content">
            <strong>Validité :</strong>
            <strong class="validity-days">45 jours non <span style="font-size: 0.8em;">renouvelable</span></strong>
          </div>
        </div>

        <figure class="qr-code">
          <!-- Utiliser directement l'URL du QR Code générée -->
          <img src="${printQRCodeUrl}" alt="QR Code">
          <figcaption>
            <b>Scannez pour</b><br>vérifier l'authenticité
            <div class="qr-info">
              Exp: ${validity.expirationDate}
            </div>
          </figcaption>
        </figure>
      </div>
    </header>

    <section>
      <table>
        <legend>
          <h3>1. Information du Propriétaire</h3>
        </legend>
        <tbody>
          <tr>
            <td>Nom :</td>
            <td>${data.nom}</td>
          </tr>
          <tr>
            <td>Prénom :</td>
            <td>${data.prenom}</td>
          </tr>
          <tr>
            <td>Sexe :</td>
            <td>${supplementaire?.sexe || "-----"}</td>
          </tr>
          <tr>
            <td>Date de naissance :</td>
            <td>${formatDateNaissance()}</td>
          </tr>
          <tr>
            <td>Lieu de naissance :</td>
            <td>${supplementaire?.lieu_naissance || "-----"}</td>
          </tr>
          <tr>
            <td>Adresse complète :</td>
            <td>${supplementaire?.adresse_complete || data.adresse}</td>
          </tr>
        </tbody>
      </table>

      <table>
        <legend>
          <h3>2. Type de document d'identité</h3>
        </legend>
        <tbody>
          <tr>
            <td colspan="2">
              <div class="checkbox-group">
                <label>
                  <input type="checkbox" name="id_type" ${
                    supplementaire?.types_document.carte_identite
                      ? "checked"
                      : ""
                  } disabled> Carte d'identité
                </label>
                <label>
                  <input type="checkbox" name="id_type" ${
                    supplementaire?.types_document.passeport ? "checked" : ""
                  } disabled> Passeport
                </label>
                <label>
                  <input type="checkbox" name="id_type" ${
                    supplementaire?.types_document.permis_conduire
                      ? "checked"
                      : ""
                  } disabled> Permis de conduire
                </label>
                <label>
                  <input type="checkbox" name="id_type" ${
                    supplementaire?.types_document.carte_electeur
                      ? "checked"
                      : ""
                  } disabled> Carte d'électeur
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <legend>
          <h3>3. Information du Véhicule</h3>
        </legend>
        <tbody>
          <tr>
            <td>NIUP Moto :</td>
            <td>${supplementaire?.niup_moto || "-----"}</td>
          </tr>
          <tr>
            <td>Marque/Modèle :</td>
            <td>${data.marque} ${data.modele || ""}</td>
          </tr>
          <tr>
            <td>Année de fabrication :</td>
            <td>${data.annee_fabrication || "-----"}</td>
          </tr>
          <tr>
            <td>Couleur :</td>
            <td>${data.couleur || "-----"}</td>
          </tr>
          <tr>
            <td>Numéro de chassis (VIN) :</td>
            <td>${data.numero_chassis || "-----"}</td>
          </tr>
          <tr>
            <td>Cylindrée / Puissance :</td>
            <td>${formatCylindree()}</td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section">
        <!-- Image de signature sécurisée -->
        <div class="secure-signature" style="right: 20px; bottom: 40px;">
          <img src="https://willyaminsi.com/signature_daf.png" alt="Signature sécurisée" width="120" height="40">
        </div>

        <table>
          <tbody>
            <tr class="signature-line">
              <td>Signature du propriétaire :</td>
              <td><span class="placeholder">_______________________________________</span></td>
            </tr>
            <tr>
              <td>Date :</td>
              <td><span class="placeholder">${getFormattedDate(
                "full"
              )}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="validation-section">
        <table>
          <legend>
            <h3>4. Validation</h3>
          </legend>
          <tbody>
            <tr>
              <td colspan="2">• Document sécurisé - propriété exclusive de Holding TSC-NPS SA</td>
            </tr>
            <tr>
              <td colspan="2">• Toute falsification, reproduction ou altération est punie par la loi</td>
            </tr>
            <tr>
              <td colspan="2">
                <div class="contact-info">
                  <div>
                    <span>📞</span>
                    <span>+243 824 559 985</span>
                  </div>
                  <div>
                    <span>📞</span>
                    <span>+243 999 249 991</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <footer>
      <p>DOCUMENT SÉCURISÉ</p>
    </footer>

  </div>

  <script>
    // Forcer le chargement des images avant l'impression
    window.onload = function() {
      const images = document.querySelectorAll('img');
      let loadedCount = 0;
      const totalImages = images.length;
      
      if (totalImages === 0) {
        triggerPrint();
        return;
      }
      
      images.forEach(img => {
        if (img.complete) {
          loadedCount++;
          checkAllLoaded();
        } else {
          img.onload = () => {
            loadedCount++;
            checkAllLoaded();
          };
          img.onerror = () => {
            loadedCount++;
            checkAllLoaded();
          };
        }
      });
      
      function checkAllLoaded() {
        if (loadedCount === totalImages) {
          triggerPrint();
        }
      }
      
      function triggerPrint() {
        // Petit délai pour s'assurer que tout est rendu
        setTimeout(() => {
          window.print();
          // Fermer la fenêtre après impression ou si annulée
          setTimeout(() => {
            window.close();
          }, 1000);
        }, 500);
      }
    };
  </script>
</body>
</html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  // Gestion des événements clavier
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
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête fixe */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Fiche d'Identification Moto
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Imprimer la Fiche</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Informations de validité */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Validité</div>
              <div
                className={`text-xl font-bold mt-1 ${
                  validity.isActive ? "text-green-600" : "text-red-600"
                }`}
              >
                {validity.remainingDays} jours restants
              </div>
              <div className="text-sm text-blue-500 mt-1">
                Expire le: {validity.expirationDate}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Statut</div>
              <div
                className={`text-xl font-bold mt-1 ${
                  validity.isActive ? "text-green-600" : "text-red-600"
                }`}
              >
                {validity.isActive ? "ACTIF" : "EXPIRÉ"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {validity.isActive ? "Document valide" : "Document expiré"}
              </div>
            </div>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="flex-1 overflow-auto p-6">
          <div ref={printRef} className="print-area">
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Prévisualisation de la Fiche
                </h4>
                <p className="text-gray-600 text-sm">
                  Format A4 - Document sécurisé avec QR Code
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">
                        Informations du propriétaire
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Nom:</span> {data.nom}
                        </div>
                        <div>
                          <span className="font-medium">Prénom:</span>{" "}
                          {data.prenom}
                        </div>
                        <div>
                          <span className="font-medium">Sexe:</span>{" "}
                          {supplementaire?.sexe || "-----"}
                        </div>
                        <div>
                          <span className="font-medium">Date naissance:</span>{" "}
                          {formatDateNaissance()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">
                        Informations du véhicule
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Plaque:</span>{" "}
                          {data.numero_plaque}
                        </div>
                        <div>
                          <span className="font-medium">NIUP Moto:</span>{" "}
                          {supplementaire?.niup_moto || "-----"}
                        </div>
                        <div>
                          <span className="font-medium">Marque:</span>{" "}
                          {data.marque} {data.modele && `(${data.modele})`}
                        </div>
                        <div>
                          <span className="font-medium">Châssis:</span>{" "}
                          {data.numero_chassis || "-----"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h5 className="font-semibold text-gray-700 mb-2">
                    QR Code
                  </h5>
                  <div className="mb-2">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="mx-auto"
                        width={120}
                        height={120}
                      />
                    ) : (
                      <div className="w-[120px] h-[120px] bg-gray-100 flex items-center justify-center mx-auto">
                        <span className="text-gray-400 text-sm">
                          QR Code généré
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Scannez pour vérifier
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Document sécurisé
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-center text-gray-600 text-sm">
                  <p>
                    Cliquez sur "Imprimer la Fiche" pour générer le document
                    complet au format A4
                  </p>
                  <p className="mt-1">
                    Le QR Code sera généré dynamiquement pour l'impression
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}