"use client";

import Link from "next/link";
import {
  Sparkles,
  Layers,
  Printer,
  CheckCircle2,
  ArrowRight,
  Zap,
  Clock,
  MousePointerClick,
  Eye,
  Hash,
  PartyPopper,
  TrendingUp,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";

export default function WhatsNewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12 lg:py-16">
        
        {/* Hero Section - Élégant et aéré */}
        <div className="relative mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Nouvelle fonctionnalité
            </span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          </div>

          {/* Titre */}
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-4 leading-[1.15]">
            Impression Multiple
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              des Cartes Roses
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 max-w-xl leading-relaxed mb-8">
            Gagnez un temps précieux. Sélectionnez l&apos;ensemble des cartes à réimprimer 
            et laissez le système travailler pour vous.
          </p>

          {/* Stats cards */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">-70%</div>
                <div className="text-xs text-slate-500">de temps</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">Illimité</div>
                <div className="text-xs text-slate-500">cartes par lot</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">1 clic</div>
                <div className="text-xs text-slate-500">pour tout lancer</div>
              </div>
            </div>
          </div>
        </div>

        {/* Before / After - Split screen moderne */}
        <div className="grid lg:grid-cols-2 gap-6 mb-20">
          {/* Avant */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                    <Printer className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <span className="text-sm font-semibold text-red-600">Avant</span>
                </div>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {["Sélectionner 1 carte", "Lancer l'impression", "Attendre", "Répéter..."].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-mono text-slate-400">
                      {i + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pour 10 cartes</span>
                  <span className="font-mono font-semibold text-red-500">~5 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenant */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-lg shadow-emerald-100/50 overflow-hidden relative">
            <div className="absolute -top-px right-6">
              <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-b-xl">
                <Zap className="w-3 h-3" />
                NOUVEAU
              </div>
            </div>
            <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-emerald-700">Maintenant</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[
                  "Sélectionner plusieurs cartes",
                  "Lancer l'impression groupée",
                  "Suivre le compteur",
                  "Terminé !",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-mono text-emerald-600">
                      {i + 1}
                    </div>
                    <span>{step}</span>
                    {i === 3 && <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-emerald-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Pour 10 cartes</span>
                  <span className="font-mono font-semibold text-emerald-600 text-lg">~30 sec</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Démo - Compteur élégant */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-4">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Visualisation
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
              Suivez la progression en temps réel
            </h2>
            <p className="text-slate-500">Le compteur décrémente automatiquement à chaque carte imprimée</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-6">
              {/* Compteur animé */}
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Restantes</div>
                  <div className="text-5xl font-mono font-bold text-slate-800">3</div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-300" />
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">En cours</div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    <span className="text-sm text-slate-500">Carte #7/10</span>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-300" />
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Terminé</div>
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
              </div>

              {/* Barre progression */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progression</span>
                  <span>70%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[70%] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                L&apos;impression s&apos;enchaîne automatiquement jusqu&apos;à la dernière carte
              </p>
            </div>
          </div>
        </div>

        {/* 3 étapes - Design épuré */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
              Comment ça marche
            </h2>
            <p className="text-slate-500">Trois étapes simples pour une efficacité maximale</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: MousePointerClick,
                title: "Sélectionnez",
                desc: "Cochez toutes les cartes roses à réimprimer. Sans limite.",
                step: "01",
                color: "blue",
              },
              {
                icon: Eye,
                title: "Suivez",
                desc: "Le compteur affiche le nombre restant et se met à jour en temps réel.",
                step: "02",
                color: "amber",
              },
              {
                icon: PartyPopper,
                title: "Terminez",
                desc: "Une confirmation visuelle apparaît quand tout est imprimé.",
                step: "03",
                color: "emerald",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-emerald-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-${item.color}-100 flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                  </div>
                  <span className="text-2xl font-mono font-bold text-slate-200 group-hover:text-slate-300 transition">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA - Final élégant */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">
                  Disponible dans le module Réimpression
                </h3>
                <p className="text-slate-300 text-sm max-w-md">
                  Retrouvez la fonctionnalité et optimisez vos impressions groupées dès maintenant.
                </p>
              </div>
            </div>
            <Link href="/activity/reimpression" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200 shadow-md">
              Découvrir
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}