// components/DeclarationActions.tsx
import React, { useState } from "react";
import {
  supprimerDeclaration,
  getDetailsDeclaration,
  traiterPaiement,
  getMethodesPaiement,
} from "../../../../services/paiement/paiementService";
import { MethodePaiement } from "../../../../services/paiement/paiementService";

interface DeclarationActionsProps {
  idDeclaration: number;
  reference: string;
  montant: number;
  onDeclarationDeleted: () => void;
  onPaiementSuccess: () => void;
}

const DeclarationActions: React.FC<DeclarationActionsProps> = ({
  idDeclaration,
  reference,
  montant,
  onDeclarationDeleted,
  onPaiementSuccess,
}) => {
  const [showModalPaiement, setShowModalPaiement] = useState(false);
  const [showRecu, setShowRecu] = useState(false);
  const [methodesPaiement, setMethodesPaiement] = useState<MethodePaiement[]>(
    []
  );
  const [selectedMethode, setSelectedMethode] = useState<number | null>(null);
  const [detailsDeclaration, setDetailsDeclaration] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSupprimer = async () => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer cette déclaration ?")
    ) {
      return;
    }

    setLoading(true);
    const result = await supprimerDeclaration(idDeclaration);
    setLoading(false);

    if (result.status === "success") {
      alert("Déclaration supprimée avec succès");
      onDeclarationDeleted();
    } else {
      alert(result.message || "Erreur lors de la suppression");
    }
  };

  const handleVoirRecu = async () => {
    setLoading(true);
    const result = await getDetailsDeclaration(idDeclaration);
    setLoading(false);

    if (result.status === "success") {
      setDetailsDeclaration(result.data);
      setShowRecu(true);
    } else {
      alert(result.message || "Erreur lors de la récupération du reçu");
    }
  };

  const handlePaiement = async () => {
    setLoading(true);
    const result = await getMethodesPaiement();
    setLoading(false);

    if (result.status === "success") {
      setMethodesPaiement(result.data);
      setShowModalPaiement(true);
    } else {
      alert(
        result.message ||
          "Erreur lors de la récupération des méthodes de paiement"
      );
    }
  };

  const handleConfirmerPaiement = async () => {
    if (!selectedMethode) {
      alert("Veuillez sélectionner une méthode de paiement");
      return;
    }

    setLoading(true);
    const result = await traiterPaiement(idDeclaration, selectedMethode);
    setLoading(false);

    if (result.status === "success") {
      alert("Paiement effectué avec succès");
      setShowModalPaiement(false);
      onPaiementSuccess();
    } else {
      alert(result.message || "Erreur lors du traitement du paiement");
    }
  };

  const imprimerRecu = () => {
    window.print();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="declaration-actions">
      <div className="action-buttons">
        <button onClick={handleSupprimer} className="btn btn-danger">
          Supprimer la déclaration
        </button>
        <button onClick={handleVoirRecu} className="btn btn-info">
          Générer le reçu
        </button>
        <button onClick={handlePaiement} className="btn btn-success">
          Payer la déclaration
        </button>
      </div>

      {/* Modal de paiement */}
      {showModalPaiement && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Choisissez votre méthode de paiement</h2>
            <div className="methodes-paiement">
              {methodesPaiement.map((methode) => (
                <div key={methode.id} className="methode-paiement">
                  <label>
                    <input
                      type="radio"
                      name="methodePaiement"
                      value={methode.id}
                      onChange={(e) =>
                        setSelectedMethode(Number(e.target.value))
                      }
                    />
                    {methode.nom} - {methode.description}
                    {methode.frais > 0 && ` (Frais: ${methode.frais}€)`}
                  </label>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowModalPaiement(false)}>
                Annuler
              </button>
              <button
                onClick={handleConfirmerPaiement}
                disabled={!selectedMethode}
              >
                Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Affichage du reçu */}
      {showRecu && detailsDeclaration && (
        <div className="recu-container">
          <div className="recu">
            <div className="recu-header">
              <h2>Reçu de Déclaration</h2>
              <p>Référence: {detailsDeclaration.reference}</p>
              <p>
                Date:{" "}
                {new Date(
                  detailsDeclaration.date_creation
                ).toLocaleDateString()}
              </p>
            </div>

            <div className="recu-content">
              <div className="contribuable-info">
                <h3>Informations du contribuable</h3>
                <p>NIF: {detailsDeclaration.nif_contribuable}</p>
                <p>Nom: {detailsDeclaration.nom_contribuable}</p>
                {detailsDeclaration.prenom_contribuable && (
                  <p>Prénom: {detailsDeclaration.prenom_contribuable}</p>
                )}
              </div>

              <div className="impot-info">
                <h3>Informations de l'impôt</h3>
                <p>Nom: {detailsDeclaration.nom_impot}</p>
                <p>Description: {detailsDeclaration.description_impot}</p>
              </div>

              <div className="montant-info">
                <h3>Montant à payer</h3>
                <p className="montant">{detailsDeclaration.montant} €</p>
              </div>

              <div className="details-formulaire">
                <h3>Détails de la déclaration</h3>
                {detailsDeclaration.donnees_json && (
                  <ul>
                    {Object.entries(detailsDeclaration.donnees_json).map(
                      ([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </div>

            <div className="recu-footer">
              <p>
                Ce document fait foi de déclaration auprès de l'administration
                fiscale.
              </p>
            </div>
          </div>

          <div className="recu-actions">
            <button onClick={() => setShowRecu(false)}>Fermer</button>
            <button onClick={imprimerRecu}>Imprimer le reçu</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .declaration-actions {
          margin-top: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }
        .btn-info {
          background-color: #17a2b8;
          color: white;
        }
        .btn-success {
          background-color: #28a745;
          color: white;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
        }

        .methodes-paiement {
          margin: 20px 0;
        }

        .methode-paiement {
          margin: 10px 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .recu-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: white;
          padding: 20px;
          overflow-y: auto;
          z-index: 1000;
        }

        .recu {
          border: 1px solid #ccc;
          padding: 20px;
          margin-bottom: 20px;
        }

        .recu-header,
        .recu-footer {
          text-align: center;
          margin-bottom: 20px;
        }

        .recu-content > div {
          margin-bottom: 20px;
        }

        .montant {
          font-size: 24px;
          font-weight: bold;
          color: #28a745;
        }

        .recu-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        @media print {
          .recu-actions {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DeclarationActions;
