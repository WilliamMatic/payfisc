"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, X, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface GenericField {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  step?: string;
}

interface GenericCrudProps<T extends { id: number }> {
  title: string;
  icon: string;
  loader: (siteId: number) => Promise<{ status: string; data?: T[] }>;
  onAdd: (data: Record<string, unknown>) => Promise<{ status: string; message?: string }>;
  onUpdate: (data: Record<string, unknown>) => Promise<{ status: string; message?: string }>;
  onDelete: (id: number) => Promise<{ status: string; message?: string }>;
  fields: GenericField[];
  columns: { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode }[];
  searchKeys?: (keyof T)[];
  extraFormData?: Record<string, unknown>;
  emptyText?: string;
}

export default function GenericCrudClient<T extends { id: number }>({
  title, icon, loader, onAdd, onUpdate, onDelete, fields, columns, searchKeys = [], extraFormData = {}, emptyText,
}: GenericCrudProps<T>) {
  type Row = T & Record<string, unknown>;
  const { utilisateur } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!utilisateur?.site_id) return;
    setLoading(true);
    const res = await loader(utilisateur.site_id);
    if (res.status === "success" && res.data) setItems(res.data);
    setLoading(false);
  }, [utilisateur?.site_id, loader]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditItem(null);
    const empty: Record<string, string> = {};
    fields.forEach((f) => { empty[f.name] = ""; });
    setForm(empty);
    setShowModal(true);
    setError(null);
  };

  const openEdit = (item: T) => {
    setEditItem(item);
    const data: Record<string, string> = {};
    const row = item as Row;
    fields.forEach((f) => {
      const v = row[f.name];
      data[f.name] = v === null || v === undefined ? "" : String(v);
    });
    setForm(data);
    setShowModal(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!utilisateur?.site_id) return;
    for (const f of fields) {
      if (f.required && !form[f.name]) { setError(`Le champ "${f.label}" est requis.`); return; }
    }
    setSaving(true); setError(null);
    const payload: Record<string, unknown> = { ...extraFormData, site_id: utilisateur.site_id };
    fields.forEach((f) => {
      const v = form[f.name];
      if (f.type === "number") payload[f.name] = v === "" ? null : Number(v);
      else payload[f.name] = v === "" ? null : v;
    });
    const res = editItem
      ? await onUpdate({ ...payload, id: editItem.id })
      : await onAdd(payload);
    if (res.status === "success") { setShowModal(false); await load(); }
    else setError(res.message || "Erreur");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    const res = await onDelete(deleteItem.id);
    if (res.status === "success") { setDeleteItem(null); await load(); }
    else setError(res.message || "Erreur");
    setSaving(false);
  };

  const filtered = search && searchKeys.length
    ? items.filter((i) => searchKeys.some((k) => String((i as Row)[k as string] ?? "").toLowerCase().includes(search.toLowerCase())))
    : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{icon}</span> {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{items.length} enregistrement(s)</p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg shadow hover:opacity-90">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {searchKeys.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{emptyText || "Aucun élément"}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {columns.map((c) => (
                  <th key={String(c.key)} className="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{c.label}</th>
                ))}
                <th className="text-right px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  {columns.map((c) => (
                    <td key={String(c.key)} className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {c.render ? c.render(row) : ((row as Row)[c.key as string] as React.ReactNode ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(row)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteItem(row)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {editItem ? "Modifier" : "Ajouter"} — {title}
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === "select" ? (
                    <select value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm">
                      <option value="">— Choisir —</option>
                      {f.options?.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      placeholder={f.placeholder} rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" />
                  ) : (
                    <input type={f.type === "number" ? "number" : "text"} step={f.step}
                      value={form[f.name] || ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg disabled:opacity-60">
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Supprimer définitivement cet élément ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteItem(null)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
