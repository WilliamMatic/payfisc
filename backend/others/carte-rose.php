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
              carte.adresse_proprietaire.length> 33
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