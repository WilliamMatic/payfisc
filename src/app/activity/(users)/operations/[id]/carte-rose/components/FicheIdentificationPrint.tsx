'use client';
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

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
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const escapeHtml = (text: string | undefined | null): string => {
    if (!text) return "";
    return String(text).replace(/[&<>"']/g, (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char)
    );
  };

  // Fonction pour générer les données du QR Code (format texte simple, identique
  // à l'impression Carte Rose : lignes clé/valeur lisibles au scan).
  const generateQRData = (): string => {
    return [
      `NOM: ${data.nom} ${data.prenom}`,
      `NIF: ${data.nif || ""}`,
      `ADRESSE: ${data.adresse || ""}`,
      `TEL: ${data.telephone || ""}`,
      `EMAIL: ${data.email || ""}`,
      `PLAQUE: ${data.numero_plaque || ""}`,
      `MARQUE: ${data.marque || ""}${data.modele ? ` ${data.modele}` : ""}`,
      `USAGE: ${data.usage || ""}`,
      `CHASSIS: ${data.numero_chassis || ""}`,
      `MOTEUR: ${data.numero_moteur || ""}`,
      `COULEUR: ${data.couleur || ""}`,
      `ANNEE FAB.: ${data.annee_fabrication || ""}`,
      `ANNEE CIRC.: ${data.annee_circulation || ""}`,
      `ENERGIE: ${data.energie || ""}`,
      `PUISSANCE: ${data.puissance_fiscal || ""}`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  // Fonction pour générer une URL de données à partir d'un SVG
  const generateQrDataUrl = (svgString: string): string => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    return URL.createObjectURL(svgBlob);
  };

  // Générer le QR Code pour l'impression
  const generateQrCodeForPrint = async (): Promise<string> => {
    setIsGeneratingQr(true);
    try {
      const qrData = generateQRData();
      
      // Créer un conteneur temporaire
      const tempDiv = document.createElement('div');
      document.body.appendChild(tempDiv);
      
      // Importer React et ReactDOM dynamiquement
      const React = await import('react');
      const { createRoot } = await import('react-dom/client');
      
      // Rendre le QR Code dans le conteneur temporaire
      const root = createRoot(tempDiv);
      
      return new Promise((resolve) => {
        root.render(
          React.createElement(QRCode, {
            value: qrData,
            size: 90, // Taille pour l'impression
            level: 'L',
            bgColor: '#FFFFFF',
            fgColor: '#000000',
          })
        );
        
        // Attendre que le rendu soit terminé
        setTimeout(() => {
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            const svgString = svgElement.outerHTML;
            const dataUrl = generateQrDataUrl(svgString);
            
            // Nettoyer
            root.unmount();
            document.body.removeChild(tempDiv);
            
            resolve(dataUrl);
          } else {
            root.unmount();
            document.body.removeChild(tempDiv);
            resolve('');
          }
        }, 50);
      });
    } catch (error) {
      console.error('Erreur lors de la génération du QR Code:', error);
      setIsGeneratingQr(false);
      return '';
    }
  };

  // Fonction pour calculer la validité
  const calculateValidity = () => {
    const dateImmatriculation = data.date_immatriculation
      ? new Date(data.date_immatriculation)
      : new Date();

    const expirationDate = new Date(dateImmatriculation);
    expirationDate.setDate(expirationDate.getDate() + 7);

    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isActive: diffDays > 0 && diffDays <= 7,
      remainingDays: diffDays > 0 ? diffDays : 0,
      expirationDate: expirationDate.toLocaleDateString("fr-FR"),
    };
  };

  const validity = calculateValidity();

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
  const getFormattedDate = (
    format: "full" | "short" | "numbers" = "numbers"
  ): string => {
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

  const handlePrint = async () => {
    setIsGeneratingQr(true);

    try {
      // Générer le QR Code pour l'impression
      const qrDataUrl = await generateQrCodeForPrint();

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setIsGeneratingQr(false);
        return;
      }

      const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fiche d'identification moto</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700;800&display=swap');

    *{
      font-family: "Saira", sans-serif;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 10px;
      background: #f5f5f5;
      color: #2a1d12;
    }

    .page-a4 {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      margin: auto;
      padding: 12mm 14mm 22mm 14mm;
      background: white;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Fond + armoirie + cache (charte conservée, opacités adoucies) */
    .full-background, .armoirie-center, .hidden-near-armoirie, .secure-signature {
      position: absolute;
      pointer-events: none;
    }
    .full-background {
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 1;
    }
    .full-background img {
      width: 100%; height: 100%;
      object-fit: cover;
      opacity: 0.45;
    }
    .armoirie-center {
      top: 50%; left: 75%;
      transform: translate(-50%, -50%);
      z-index: 2;
    }
    .armoirie-center img {
      width: 200px; height: auto;
      opacity: 0.10;
    }
    .hidden-near-armoirie { z-index: 2; }
    .secure-signature { z-index: 3; }

    header, .meta-row, .blocks, .signature-section, .legal-section, footer {
      position: relative;
      z-index: 4;
    }

    /* ======================= HEADER ======================= */
    header {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 10px;
      margin-bottom: 8px;
    }

    .header__title {
      flex: 1;
      background: linear-gradient(135deg, #9f5514 0%, #7a3f0c 100%);
      color: #fff;
      padding: 10px 16px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(159, 85, 20, 0.15);
    }

    .header__title h1 {
      margin: 0;
      font-size: 1.45em;
      font-weight: 700;
      letter-spacing: 0.3px;
      line-height: 1.15;
    }

    .header__title p {
      margin: 4px 0 0 0;
      font-size: 0.78em;
      font-weight: 300;
      opacity: 0.92;
      line-height: 1.3;
    }

    .header__qr {
      width: 110px;
      flex-shrink: 0;
      background: #fff;
      border: 2px solid #9f5514;
      border-radius: 6px;
      padding: 5px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .header__qr img,
    .header__qr svg {
      width: 90px;
      height: 90px;
      display: block;
      margin: 0 auto 2px;
    }

    .header__qr .qr-label {
      font-size: 0.55em;
      font-weight: 600;
      color: #9f5514;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }

    /* ======================= META ROW (n° fiche + validité) ======================= */
    .meta-row {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }

    .meta-card {
      flex: 1;
      background: #fff;
      border: 1px solid #e8d9c8;
      border-left: 3px solid #9f5514;
      padding: 6px 10px;
      border-radius: 4px;
    }

    .meta-card .meta-label {
      font-size: 0.65em;
      font-weight: 600;
      color: #9f5514;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 0;
    }

    .meta-card .meta-value {
      font-size: 0.95em;
      font-weight: 600;
      color: #2a1d12;
      margin: 2px 0 0 0;
    }

    .meta-card .meta-value.accent {
      color: #9f5514;
    }

    /* ======================= BLOCKS (Assujetti / Engin) ======================= */
    .blocks {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .block {
      flex: 1;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #e8d9c8;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .block__title {
      background: #9f5514;
      color: #fff;
      padding: 6px 12px;
      font-size: 0.85em;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .block__title .num {
      width: 18px;
      height: 18px;
      background: #fff;
      color: #9f5514;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85em;
      font-weight: 700;
    }

    .block__body {
      padding: 8px 12px;
    }

    .field {
      display: flex;
      padding: 5px 0;
      border-bottom: 1px solid #f3ece4;
      font-size: 0.82em;
    }
    .field:last-child { border-bottom: none; }

    .field .label {
      width: 42%;
      font-weight: 500;
      color: #6b5444;
    }

    .field .value {
      flex: 1;
      font-weight: 600;
      color: #2a1d12;
      word-break: break-word;
    }

    .field .value.muted {
      color: #b09988;
      font-weight: 400;
      font-style: italic;
    }

    /* ======================= SIGNATURE ======================= */
    .signature-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 8px;
      padding: 10px 4px 0;
      border-top: 1px dashed #d6c2ad;
      gap: 20px;
    }

    .signature-block {
      flex: 1;
      max-width: 48%;
    }

    .signature-block .sig-label {
      font-size: 0.72em;
      font-weight: 600;
      color: #6b5444;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 4px;
    }

    .signature-block .sig-line {
      border-bottom: 1px solid #999;
      height: 32px;
      position: relative;
    }

    .signature-block .sig-line img {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      height: 32px;
      width: auto;
    }

    .signature-block .sig-date {
      font-size: 0.7em;
      color: #6b5444;
      margin-top: 3px;
    }

    /* ======================= LEGAL / VALIDATION ======================= */
    .legal-section {
      margin-top: 10px;
      background: rgba(249, 244, 238, 0.9);
      border: 1px solid #e8d9c8;
      border-radius: 4px;
      padding: 8px 12px;
    }

    .legal-section .legal-title {
      font-size: 0.75em;
      font-weight: 700;
      color: #9f5514;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
    }

    .legal-section ul {
      margin: 0;
      padding: 0 0 0 14px;
      font-size: 0.7em;
      color: #6b5444;
      line-height: 1.5;
    }

    .legal-section .contacts {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #d6c2ad;
      display: flex;
      gap: 18px;
      font-size: 0.72em;
      color: #6b5444;
    }

    .legal-section .contacts span { font-weight: 600; color: #9f5514; }

    /* ======================= FOOTER ======================= */
    footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #9f5514;
      height: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 14mm;
      z-index: 4;
    }

    footer p {
      color: rgba(255, 255, 255, 0.95);
      font-size: 0.7em;
      margin: 0;
      font-weight: 700;
      letter-spacing: 1px;
    }

    footer .footer-ref {
      font-weight: 400;
      letter-spacing: 0.3px;
      opacity: 0.85;
    }

    /* ======================= PRINT ======================= */
    @media print {
      body {
        background: none;
        padding: 0;
        margin: 0;
      }

      .page-a4 {
        border: none;
        margin: 0;
        height: 297mm;
        min-height: 297mm;
        box-shadow: none;
      }

      .full-background, .armoirie-center, .hidden-near-armoirie,
      .secure-signature, .header__title, .header__qr,
      .block__title, .meta-card, footer {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .block, .legal-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="page-a4">

    <!-- Fond + armoirie + image décorative (charte conservée) -->
    <div class="full-background">
      <img src="https://willyaminsi.com/fond.png" alt="Fond de page">
    </div>
    <div class="armoirie-center">
      <img src="https://willyaminsi.com/armoirie.png" alt="Armoirie">
    </div>
    <div class="hidden-near-armoirie" style="top: 60%; left: 66%;">
      <img src="https://willyaminsi.com/cache.png" alt="" width="150" height="150" style="opacity:.6;">
    </div>

    <!-- HEADER : titre + QR -->
    <header>
      <div class="header__title">
        <h1>FICHE D'IDENTIFICATION & IMMATRICULATION MOTO</h1>
        <p>Tenant lieu de Carte Rose & Plaque d'immatriculation provisoire</p>
      </div>
      <div class="header__qr">
        ${qrDataUrl
          ? `<img src="${qrDataUrl}" alt="QR Code" />`
          : '<div style="width:90px;height:90px;background:#f0f0f0;"></div>'}
        <div class="qr-label">Authentification</div>
      </div>
    </header>

    <!-- META : N° fiche / Émission / Validité / Expiration -->
    <div class="meta-row">
      <div class="meta-card">
        <p class="meta-label">N° Fiche</p>
        <p class="meta-value">${escapeHtml(data.paiement_id) || "—"}</p>
      </div>
      <div class="meta-card">
        <p class="meta-label">Date d'émission</p>
        <p class="meta-value">${getFormattedDate("numbers")}</p>
      </div>
      <div class="meta-card">
        <p class="meta-label">Validité</p>
        <p class="meta-value accent">7 jours non renouvelable</p>
      </div>
      <div class="meta-card">
        <p class="meta-label">Expiration</p>
        <p class="meta-value accent">${validity.expirationDate}</p>
      </div>
    </div>

    <!-- DEUX BLOCS : Assujetti + Engin -->
    <div class="blocks">
      <div class="block">
        <div class="block__title"><span class="num">1</span> Assujetti</div>
        <div class="block__body">
          <div class="field">
            <span class="label">Nom</span>
            <span class="value${data.nom ? "" : " muted"}">${escapeHtml(data.nom) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Prénom</span>
            <span class="value${data.prenom ? "" : " muted"}">${escapeHtml(data.prenom) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">NIF</span>
            <span class="value${data.nif ? "" : " muted"}">${escapeHtml(data.nif) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Adresse</span>
            <span class="value${data.adresse ? "" : " muted"}">${escapeHtml(data.adresse) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Téléphone</span>
            <span class="value${data.telephone ? "" : " muted"}">${escapeHtml(data.telephone) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Email</span>
            <span class="value${data.email ? "" : " muted"}">${escapeHtml(data.email) || "—"}</span>
          </div>
        </div>
      </div>

      <div class="block">
        <div class="block__title"><span class="num">2</span> Engin</div>
        <div class="block__body">
          <div class="field">
            <span class="label">Plaque</span>
            <span class="value${data.numero_plaque ? "" : " muted"}">${escapeHtml(data.numero_plaque) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Marque / Modèle</span>
            <span class="value${data.marque ? "" : " muted"}">${escapeHtml(data.marque) || "—"}${data.modele ? " " + escapeHtml(data.modele) : ""}</span>
          </div>
          <div class="field">
            <span class="label">Usage</span>
            <span class="value${data.usage ? "" : " muted"}">${escapeHtml(data.usage) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Année fab. / circ.</span>
            <span class="value">${escapeHtml(data.annee_fabrication) || "—"} / ${escapeHtml(data.annee_circulation) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Couleur</span>
            <span class="value${data.couleur ? "" : " muted"}">${escapeHtml(data.couleur) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Énergie</span>
            <span class="value${data.energie ? "" : " muted"}">${escapeHtml(data.energie) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Châssis (VIN)</span>
            <span class="value${data.numero_chassis ? "" : " muted"}">${escapeHtml(data.numero_chassis) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Moteur</span>
            <span class="value${data.numero_moteur ? "" : " muted"}">${escapeHtml(data.numero_moteur) || "—"}</span>
          </div>
          <div class="field">
            <span class="label">Cylindrée / Puissance</span>
            <span class="value">${formatCylindree()}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SIGNATURES -->
    <div class="signature-section">
      <div class="signature-block">
        <div class="sig-label">Signature de l'assujetti</div>
        <div class="sig-line"></div>
        <div class="sig-date">Date : ${getFormattedDate("full")}</div>
      </div>
      <div class="signature-block">
        <div class="sig-label">Signature autorisée (DAF)</div>
        <div class="sig-line">
          <img src="https://willyaminsi.com/signature_daf.png" alt="Signature DAF">
        </div>
        <div class="sig-date">Cachet officiel — Holding TSC-NPS SA</div>
      </div>
    </div>

    <!-- VALIDATION / LÉGAL -->
    <div class="legal-section">
      <p class="legal-title">Validation & Mentions légales</p>
      <ul>
        <li>Document sécurisé — propriété exclusive de Holding TSC-NPS SA.</li>
        <li>Toute falsification, reproduction ou altération est punie par la loi.</li>
        <li>Présentez ce document à toute réquisition des autorités compétentes.</li>
      </ul>
      <div class="contacts">
        <div>📞 <span>+243 824 559 985</span></div>
        <div>📞 <span>+243 999 249 991</span></div>
      </div>
    </div>

    <footer>
      <p>DOCUMENT SÉCURISÉ</p>
      <p class="footer-ref">Réf. ${escapeHtml(data.paiement_id) || "—"} · Émis le ${getFormattedDate("numbers")}</p>
    </footer>

  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          window.close();
        }, 500);
      }, 500);
    });
  </script>
</body>
</html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Nettoyer l'URL après impression
        setTimeout(() => {
          if (qrDataUrl) {
            URL.revokeObjectURL(qrDataUrl);
          }
          setIsGeneratingQr(false);
        }, 5000);
      } catch (error) {
        console.error('Erreur lors de l\'impression:', error);
        setIsGeneratingQr(false);
      }
  };

  // Auto-déclenchement de l'impression dès que isOpen passe à true.
  // Plus de modal de prévisualisation : on imprime directement, puis onClose.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        await handlePrint();
      } finally {
        if (!cancelled) onClose();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return null;
}