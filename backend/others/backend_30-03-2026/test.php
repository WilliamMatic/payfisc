<?php
// ============================================
// CONFIGURATION DE LA BASE DE DONNÉES
// ============================================
$host = 'localhost';
$dbname = 'c0mpako';
$username = 'c0willyam';
$password = 'acmilan poli';

// ============================================
// CONNEXION PDO À LA BASE DE DONNÉES
// ============================================
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    
    echo "Connexion à la base de données réussie.\n";
    echo "Début de la génération des séries et items...\n\n";
    
    // ============================================
    // DÉSACTIVER LES CONTRAINTES TEMPORAIREMENT
    // ============================================
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    // ============================================
    // DÉBUT DE LA TRANSACTION POUR PERFORMANCE
    // ============================================
    $pdo->beginTransaction();
    
    $totalSeries = 0;
    $totalItems = 0;
    $startTime = microtime(true);
    
    // ============================================
    // GÉNÉRATION DES SÉRIES DE AA À ZZ
    // ============================================
    for ($i = ord('A'); $i <= ord('Z'); $i++) {
        for ($j = ord('A'); $j <= ord('Z'); $j++) {
            $nomSerie = chr($i) . chr($j);
            
            // Insertion de la série
            $stmtSerie = $pdo->prepare("
                INSERT INTO `series` (
                    `nom_serie`, 
                    `province_id`, 
                    `debut_numeros`, 
                    `fin_numeros`
                ) VALUES (:nom_serie, :province_id, :debut, :fin)
            ");
            
            $stmtSerie->execute([
                ':nom_serie' => $nomSerie,
                ':province_id' => 16,
                ':debut' => 1,
                ':fin' => 999
            ]);
            
            $serieId = $pdo->lastInsertId();
            $totalSeries++;
            
            // ============================================
            // PRÉPARATION DE L'INSERTION DES ITEMS
            // ============================================
            // Nous allons insérer par lots de 100 pour plus d'efficacité
            $batchSize = 100;
            $numBatches = ceil(999 / $batchSize);
            
            for ($batch = 0; $batch < $numBatches; $batch++) {
                $startNum = ($batch * $batchSize) + 1;
                $endNum = min(($batch + 1) * $batchSize, 999);
                
                $values = [];
                $placeholders = [];
                
                for ($num = $startNum; $num <= $endNum; $num++) {
                    $values[] = $serieId;
                    $values[] = $num;
                    $values[] = '0';
                    $placeholders[] = "(?, ?, ?)";
                }
                
                if (!empty($values)) {
                    $sql = "INSERT INTO `serie_items` (`serie_id`, `value`, `statut`) VALUES ";
                    $sql .= implode(", ", $placeholders);
                    
                    $stmtItems = $pdo->prepare($sql);
                    $stmtItems->execute($values);
                    
                    $totalItems += ($endNum - $startNum + 1);
                }
            }
            
            // Affichage de progression
            if ($totalSeries % 50 == 0) {
                $progress = round(($totalSeries / 676) * 100, 2);
                echo "Progression : $progress% ($totalSeries/676 séries créées)\n";
            }
        }
    }
    
    // ============================================
    // VALIDATION DE LA TRANSACTION
    // ============================================
    $pdo->commit();
    
    // ============================================
    // RÉACTIVATION DES CONTRAINTES
    // ============================================
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    $endTime = microtime(true);
    $executionTime = round($endTime - $startTime, 2);
    
    // ============================================
    // RÉCAPITULATIF
    // ============================================
    echo "\n============================================\n";
    echo "GÉNÉRATION TERMINÉE AVEC SUCCÈS !\n";
    echo "============================================\n";
    echo "Séries créées : $totalSeries (AA à ZZ)\n";
    echo "Items créés : $totalItems\n";
    echo "Temps d'exécution : $executionTime secondes\n";
    echo "============================================\n";
    
} catch (PDOException $e) {
    // ============================================
    // GESTION DES ERREURS
    // ============================================
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    if (isset($pdo)) {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    }
    
    die("ERREUR PDO : " . $e->getMessage() . "\n");
} finally {
    // ============================================
    // FERMETURE DE LA CONNEXION
    // ============================================
    if (isset($pdo)) {
        $pdo = null;
    }
}
?>