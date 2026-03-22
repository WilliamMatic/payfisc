// components/EnginInfo.tsx
"use client";

import {
  Bike,
  Calendar,
  Fuel,
  Gauge,
  Palette,
  Wrench,
  Cpu,
  Hash,
  Component,
  Droplets,
} from "lucide-react";
import { Engin } from "./types";

interface EnginInfoProps {
  engin: Engin;
}

export default function EnginInfo({ engin }: EnginInfoProps) {
  const infos = [
    {
      icon: Bike,
      label: "Marque/Modèle",
      value: `${engin.marque} ${engin.modele}`,
    },
    { icon: Hash, label: "Numéro Plaque", value: engin.numero_plaque },
    {
      icon: Calendar,
      label: "Année Fabrication",
      value: engin.annee_fabrication,
    },
    {
      icon: Calendar,
      label: "Année Circulation",
      value: engin.annee_circulation || engin.annee_fabrication,
    },
    {
      icon: Fuel,
      label: "Énergie",
      value: engin.energie || "Non renseignée",
    },
    {
      icon: Gauge,
      label: "Puissance Fiscale",
      value: `${engin.puissance_fiscal} CV`,
    },
    {
      icon: Palette,
      label: "Couleur",
      value: engin.couleur || "Non renseignée",
    },
    { icon: Component, label: "Numéro Châssis", value: engin.numero_chassis },
    { icon: Cpu, label: "Numéro Moteur", value: engin.numero_moteur },
    {
      icon: Droplets,
      label: "Type Engin",
      value: engin.type_engin || "Non renseigné",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Informations Véhicule
            </h2>
          </div>
          <div className="bg-white/20 px-4 py-2 rounded-lg">
            <span className="text-white font-bold text-lg">
              {engin.numero_plaque}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infos.map((info, index) => {
            const Icon = info.icon;
            return (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{info.label}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {info.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Badge ID Engin */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="bg-gray-50 rounded-lg px-4 py-2">
              <p className="text-xs text-gray-500">ID Engin</p>
              <p className="text-sm font-mono font-bold text-gray-900">
                {engin.id}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg px-4 py-2">
              <p className="text-xs text-emerald-600">Usage</p>
              <p className="text-sm font-bold text-emerald-700">
                {Number(engin.usage_engin) === 1 ? "Particulier" : "Professionnel"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
