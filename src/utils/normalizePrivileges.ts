import { Privileges } from '@/services/utilisateurs/utilisateurService';

export const emptyPrivileges: Privileges = {
  ventePlaque: {
    simple: false,
    special: false,
    delivrance: false,
    correctionErreur: false,
    plaque: false,
    reproduction: false,
    series: false,
    autresTaxes: false,
  },
  vignette: {
    venteDirecte: false,
    delivrance: false,
    renouvellement: false,
  },
  assurance: {
    venteDirecte: false,
    delivrance: false,
    renouvellement: false,
  },
};

/**
 * Normalizes privileges from either flat (old) or nested (new) format
 * into the standard nested Privileges structure.
 */
export function normalizePrivileges(priv: any): Privileges {
  if (!priv) return emptyPrivileges;

  // Already nested format
  if (priv.ventePlaque && typeof priv.ventePlaque === 'object') {
    return {
      ventePlaque: { ...emptyPrivileges.ventePlaque, ...priv.ventePlaque },
      vignette: { ...emptyPrivileges.vignette, ...priv.vignette },
      assurance: { ...emptyPrivileges.assurance, ...priv.assurance },
    };
  }

  // Old flat format → convert to nested
  return {
    ventePlaque: {
      simple: !!priv.simple,
      special: !!priv.special,
      delivrance: !!priv.delivrance,
      correctionErreur: !!priv.correctionErreur,
      plaque: !!priv.plaque,
      reproduction: !!priv.reproduction,
      series: !!priv.series,
      autresTaxes: !!priv.autresTaxes,
    },
    vignette: { ...emptyPrivileges.vignette },
    assurance: { ...emptyPrivileges.assurance },
  };
}

/**
 * Parses privileges_include from a user object (JSON string) 
 * and normalizes to nested format.
 */
export function parseAndNormalizePrivileges(privilegesInclude: any): Privileges {
  if (!privilegesInclude) return emptyPrivileges;

  try {
    const parsed = typeof privilegesInclude === 'string'
      ? JSON.parse(privilegesInclude)
      : privilegesInclude;
    return normalizePrivileges(parsed);
  } catch {
    return emptyPrivileges;
  }
}
