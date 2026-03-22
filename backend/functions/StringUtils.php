<?php 

/**
 * Retire tous les zéros au début d'une chaîne ou d'un nombre.
 */
function removeLeadingZeros($value)
{
    // Convertir en chaîne au cas où un nombre est passé
    $value = (string)$value;

    // Supprime tous les zéros en début de chaîne
    $clean = ltrim($value, '0');

    // Si la chaîne devient vide (ex: "0000"), on retourne "0"
    return $clean === '' ? '0' : $clean;
}



echo removeLeadingZeros("00012500"); // 125
