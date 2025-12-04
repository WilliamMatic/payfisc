"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Printer,
  Eye,
  Filter,
  Download,
  RefreshCw,
  User,
  Car,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bike,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { formatPlaque } from "../operations/utils/formatPlaque";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCartesReprint,
  mettreAJourStatusCarte,
  CarteReprintData,
} from "@/services/cartes-reprint/cartesReprintService";

// Type pour les cartes à réimprimer
interface CarteReprint {
  id: number;
  id_primaire: number;
  nom_proprietaire: string;
  adresse_proprietaire?: string;
  nif_proprietaire?: string;
  annee_mise_circulation: string;
  numero_plaque: string;
  marque_vehicule?: string;
  usage_vehicule?: string;
  numero_chassis?: string;
  numero_moteur?: string;
  annee_fabrication?: string;
  couleur_vehicule?: string;
  puissance_vehicule?: string;
  utilisateur_id: number;
  utilisateur_nom?: string;
  site_id: number;
  site_nom?: string;
  status: 0 | 1;
  date_creation: string;
  date_creation_formatted?: string;
}

// Modal d'erreur
interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

function ErrorModal({ isOpen, title, message, onClose }: ErrorModalProps) {
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
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{message}</p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant Modal d'impression
interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  carte: CarteReprint;
  utilisateur: any;
  onPrintSuccess: (carteId: number) => void;
}

function PrintModal({
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
    const paiementId = carte.id_primaire.toString();

    return `DGRK/${month}/${year}/${carte.id}`;
  };

  const handlePrint = async () => {
    if (printRef.current) {
      setIsPrinting(true);
      setPrintError(null);

      try {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error(
            "Impossible d'ouvrir la fenêtre d'impression. Vérifiez votre bloqueur de fenêtres popup."
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
        border-top: 0.15mm dashed rgba(255,255,255,0.0); 
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
      <div style="position: absolute;top: 0;left: 0;right: 0;display: flex;justify-content: center;align-items: center;">
        <span style="font-size: .5em;">${generateDGRKACode()}</span>
      </div>
      <table>
        <tbody>
          <tr>
            <th></th>
            <td style="position: relative; top: 3px;text-transform: uppercase;font-weight: normal !important;">${
              carte.nom_proprietaire
            }</td>
          </tr>
          <tr>
            <th></th>
            <td style="position: relative; top: 4px;text-transform: uppercase;font-weight: normal !important;">${
              carte.adresse_proprietaire || ""
            }</td>
          </tr>
          <tr style="position: relative; top: 8px;">
            <th></th>
            <td style="position: relative; top: 8px;text-transform: uppercase;font-weight: normal !important;"></td>
          </tr>
          <tr>
            <th style="position: relative; top: 9px;"></th>
            <td style="position: relative; top: ${
              carte.adresse_proprietaire &&
              carte.adresse_proprietaire.length > 33
                ? "13px"
                : "24px"
            };text-transform: uppercase;">${carte.annee_mise_circulation}</td>
          </tr>
          <tr style="position: relative; top: 23px;">
            <th></th>
            <td style="position: relative; top: ${
              carte.adresse_proprietaire &&
              carte.adresse_proprietaire.length > 33
                ? "2px"
                : "14px"
            };text-transform: uppercase;" class="plaque-number">${
          utilisateur?.province_code || ""
        } ${formatPlaque(carte.numero_plaque) || ""}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="qr">
        ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ""}
        <span style="position: absolute;bottom: -20px;font-size: .5em;font-weight: bold;">${getCurrentDate()}</span>
      </div>
    </div>

    <!-- VERSO (PAGE 2) -->
    <div class="card" style="height: 40mm;margin-top: 30px;">
      <table>
        <tbody>
          <tr style="position: relative; top: -11px;">
            <th></th>
            <td style="text-transform: uppercase;">${
              carte.marque_vehicule || ""
            }</td>
          </tr>
          <tr style="position: relative; top: -17px;">
            <th></th>
            <td style="text-transform: uppercase;">${
              carte.usage_vehicule || ""
            }</td>
          </tr>
          <tr style="position: relative; top: -23px;">
            <th></th>
            <td style="text-transform: uppercase;">${
              carte.numero_chassis || "-"
            }</td>
          </tr>
          <tr style="position: relative; top: -29px;">
            <th></th>
            <td style="text-transform: uppercase;">${
              carte.numero_moteur || "-"
            }</td>
          </tr>
          <tr style="position: relative; top: -33px;">
            <th></th>
            <td style="text-transform: uppercase;">${
              carte.annee_fabrication || "-"
            }</td>
          </tr>
          <tr style="position: relative; top: -38px;">
            <th></th>
            <td style="text-transform: uppercase;">${
              carte.couleur_vehicule || "-"
            }</td>
          </tr>
          <tr style="position: relative; top: -43px;">
            <th></th>
            <td style="text-transform: uppercase;">${
              carte.puissance_vehicule || "-"
            }</td>
          </tr>
        </tbody>
      </table>

      <div class="sig-wrap">
        <div class="signature-box"><img src="https://willyaminsi.com/signature-fixe.jpg" width="70" height="50" style="position: relative;top: 0px;"></div>
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

        // Mise à jour du statut après impression
        if (carte.status === 0) {
          try {
            const result = await mettreAJourStatusCarte(carte.id_primaire);
            if (result.status === "success") {
              onPrintSuccess(carte.id);
            } else {
              throw new Error(
                result.message || "Erreur lors de la mise à jour du statut"
              );
            }
          } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:", error);
            setPrintError(
              error instanceof Error
                ? error.message
                : "Erreur lors de la mise à jour du statut"
            );
          }
        }
      } catch (error) {
        console.error("Erreur d'impression:", error);
        setPrintError(
          error instanceof Error ? error.message : "Erreur lors de l'impression"
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
        {/* En-tête fixe */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Réimpression de la Carte Rose
            </h3>
            <div className="flex space-x-3">
              {/* {carte.status === 0 && (
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
              )} */}
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

          {/* Informations */}
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

          {/* Erreur d'impression */}
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

        {/* Contenu scrollable */}
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

                .dgrka-code { 
                  position: absolute; 
                  top: 2mm; 
                  left: 0; 
                  right: 0; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center;
                  font-size: 1.8mm;
                  font-weight: bold;
                }
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
                  {/* RECTO */}
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

                    {/* QR Code */}
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

                  {/* VERSO */}
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

                    {/* Signature */}
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

        {/* Instructions */}
        <div className="p-4 border-t border-gray-200 bg-blue-50 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Instructions importantes :</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Cliquez sur la carte pour voir le recto et le verso</li>
                {carte.status === 0 && (
                  <li>Cliquez sur "Imprimer" pour générer les deux pages</li>
                )}
                {carte.status === 1 && <li>Cette carte a déjà été imprimée</li>}
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

// Composant principal
export default function CartesReprintScreen() {
  const { utilisateur } = useAuth();

  const [cartes, setCartes] = useState<CarteReprint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1">("all");
  const [selectedCarte, setSelectedCarte] = useState<CarteReprint | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    aImprimer: 0,
    dejaImprime: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  // Fonction pour gérer les erreurs
  const handleError = (title: string, message: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
    });
  };

  // Charger les données
  const loadCartes = useCallback(async () => {
    if (!utilisateur) {
      handleError("Erreur d'authentification", "Utilisateur non connecté");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCartesReprint(
        utilisateur,
        pagination.page,
        pagination.limit,
        searchTerm,
        statusFilter
      );

      if (response.status === "success") {
        setCartes(response.data || []);
        setStats(response.stats || stats);
        setPagination(response.pagination || pagination);
      } else {
        handleError(
          "Erreur de chargement",
          response.message || "Échec de la récupération des données"
        );
        setCartes([]);
        setStats({ total: 0, aImprimer: 0, dejaImprime: 0 });
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      let errorMessage = "Erreur réseau. Vérifiez votre connexion.";

      if (err instanceof SyntaxError) {
        errorMessage = "Erreur de format JSON dans la réponse du serveur";
      } else if (err instanceof TypeError) {
        errorMessage = "Erreur de connexion au serveur";
      }

      handleError("Erreur système", errorMessage);
      setCartes([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    utilisateur,
    pagination.page,
    pagination.limit,
    searchTerm,
    statusFilter,
  ]);

  // Chargement initial
  useEffect(() => {
    loadCartes();
  }, [loadCartes]);

  // Gérer le changement de page
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Gérer l'impression
  const handlePrintClick = (carte: CarteReprint) => {
    setSelectedCarte(carte);
    setShowPrintModal(true);
  };

  // Mettre à jour le statut après impression
  const handlePrintSuccess = (carteId: number) => {
    // Mettre à jour localement
    setCartes((prev) =>
      prev.map((carte) =>
        carte.id === carteId ? { ...carte, status: 1 } : carte
      )
    );

    // Mettre à jour les statistiques
    setStats((prev) => ({
      ...prev,
      aImprimer: Math.max(0, prev.aImprimer - 1),
      dejaImprime: prev.dejaImprime + 1,
    }));

    setShowPrintModal(false);
  };

  // Actualiser les données
  const handleRefresh = () => {
    loadCartes();
  };

  // Filtrer les cartes
  const filteredCartes = cartes.filter((carte) => {
    const matchesSearch =
      searchTerm === "" ||
      carte.nom_proprietaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carte.numero_plaque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carte.nif_proprietaire
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      carte.utilisateur_nom?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || carte.status.toString() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* En-tête */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Cartes à Réimprimer
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion des cartes roses nécessitant une réimpression
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Site:{" "}
                <span className="font-semibold">
                  {utilisateur?.site_nom || "Non spécifié"}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>{isLoading ? "Chargement..." : "Actualiser"}</span>
              </button>
            </div>
          </div>

          {/* Chargement */}
          {isLoading && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700">Chargement des données...</span>
              </div>
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">
                Total des cartes
              </div>
              <div className="text-2xl font-bold text-blue-800 mt-1">
                {stats.total}
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
              <div className="text-sm text-amber-600 font-medium">
                À imprimer
              </div>
              <div className="text-2xl font-bold text-amber-800 mt-1">
                {stats.aImprimer}
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="text-sm text-green-600 font-medium">
                Déjà imprimées
              </div>
              <div className="text-2xl font-bold text-green-800 mt-1">
                {stats.dejaImprime}
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Barre de recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, plaque, NIF..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filtres */}
            <div className="flex space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">Tous les status</option>
                <option value="0">À imprimer</option>
                <option value="1">Déjà imprimé</option>
              </select>
              <button
                onClick={() => loadCartes()}
                disabled={isLoading}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Liste des cartes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Numéro de plaque
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCartes.map((carte) => (
                  <tr
                    key={carte.id_primaire}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedCarte(carte);
                      setShowPrintModal(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {carte.nom_proprietaire}
                          </div>
                          <div className="text-sm text-gray-500">
                            {carte.nif_proprietaire}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                        <Bike className="w-4 h-4 mr-2" />
                        {formatPlaque(carte.numero_plaque)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {carte.utilisateur_nom}
                      </div>
                      <div className="text-sm text-gray-500">
                        {carte.site_nom}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {carte.date_creation_formatted ||
                          new Date(carte.date_creation).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {carte.status === 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                          <AlertCircle className="w-4 h-4 mr-1" />À imprimer
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Imprimé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {carte.status === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintClick(carte);
                          }}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimer
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCarte(carte);
                          setShowPrintModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Message si aucune carte */}
          {filteredCartes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune carte trouvée
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || statusFilter !== "all"
                  ? "Aucune carte ne correspond à vos critères de recherche. Essayez de modifier vos filtres ou votre terme de recherche."
                  : "Il n'y a actuellement aucune carte à réimprimer pour votre site."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredCartes.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                à{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                sur <span className="font-medium">{pagination.total}</span>{" "}
                résultats
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Précédent
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${
                            pagination.page === pageNum
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'impression */}
      {selectedCarte && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          carte={selectedCarte}
          onPrintSuccess={handlePrintSuccess}
          utilisateur={utilisateur}
        />
      )}

      {/* Modal d'erreur */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
