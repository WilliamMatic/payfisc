"use client";

import { User, Phone, MapPin, FileText, Mail } from "lucide-react";
import { Assujetti } from "./types";

interface AssujettiInfoProps {
  assujetti: Assujetti;
}

export default function AssujettiInfo({ assujetti }: AssujettiInfoProps) {
  const infos = [
    { icon: User, label: "Nom complet", value: assujetti.nom_complet },
    {
      icon: Phone,
      label: "Téléphone",
      value: assujetti.telephone || "Non renseigné",
    },
    { icon: MapPin, label: "Adresse", value: assujetti.adresse },
    { icon: FileText, label: "NIF", value: assujetti.nif || "Non renseigné" },
    { icon: Mail, label: "Email", value: assujetti.email || "Non renseigné" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Informations Assujetti
          </h2>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {infos.map((info, index) => {
            const Icon = info.icon;
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-4 h-4 text-gray-600" />
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

        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500">ID Assujetti</p>
            <p className="text-sm font-mono font-bold text-gray-900">
              {assujetti.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
