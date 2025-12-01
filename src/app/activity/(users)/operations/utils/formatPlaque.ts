/**
 * Formate une plaque d'immatriculation selon le standard (2 lettres + 3 chiffres)
 * @param plaque - La plaque à formater (ex: "AA1", "AB12", "CD123")
 * @returns La plaque formatée (ex: "AA001", "AB012", "CD123")
 */
export const formatPlaque = (plaque: string): string => {
  if (!plaque || typeof plaque !== 'string') {
    return plaque || '';
  }

  // Nettoyer la plaque (enlever espaces, mettre en majuscule)
  const plaqueClean = plaque.trim().toUpperCase();
  
  // Séparer les lettres et les chiffres
  const lettres = plaqueClean.match(/[A-Z]+/)?.[0] || '';
  const chiffres = plaqueClean.match(/\d+/)?.[0] || '';

  // Valider que c'est bien 2 lettres
  if (lettres.length !== 2) {
    console.warn(`Format de plaque invalide: "${plaque}" - Doit contenir 2 lettres`);
    return plaqueClean;
  }

  // Formater les chiffres avec les zéros manquants
  let chiffresFormates = chiffres;
  
  if (chiffres.length === 1) {
    chiffresFormates = `00${chiffres}`;
  } else if (chiffres.length === 2) {
    chiffresFormates = `0${chiffres}`;
  } else if (chiffres.length > 3) {
    console.warn(`Format de plaque invalide: "${plaque}" - Trop de chiffres`);
    return plaqueClean;
  }

  return `${lettres}${chiffresFormates}`;
};