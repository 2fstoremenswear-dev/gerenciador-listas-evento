// Componente para gerenciar promoters (apenas para owners)

"use client";

import { useState } from "react";
import { Promoter, PromoterPermissions, DEFAULT_PROMOTER_PERMISSIONS } from "@/lib/types";
import { Plus, X, Users, Mail, Phone, Settings, Trash2 } from "lucide-react";

interface PromoterManagerProps {
  eventId: string;
  promoters: Promoter[];
  ownerId: string;
  onAddPromoter: (promoter: Omit<Promoter, "id" | "createdAt" | "guestsAdded">) => void;
  onUpdatePromoter: (promoterId: string, updates: Partial<Promoter>) => void;
  onDeletePromoter: (promoterId: string) => void;
}

export default function PromoterManager({
  eventId,
  promoters,
  ownerId,
  onAddPromoter,
  onUpdatePromoter,
  onDeletePromoter,
}: PromoterManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    guestQuota: "",
    permissions: { ...DEFAULT_PROMOTER_PERMISSIONS },
  });

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      guestQuota: "",
      permissions: { ...DEFAULT_PROMOTER_PERMISSIONS },
    });
    setEditingPromoter(null);
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) return;

    const promoterData = {
      userId: `user-${Date.now()}`, // Simulação - em produção seria ID real
      eventId,
      name: form.name,
      email: form.email,
      phone: form.phone,
      permissions: form.permissions,
      guestQuota: form.guestQuota ? parseInt(form.guestQuota) : undefined,
      invitedBy: ownerId,
    };

    if (editingPromoter) {
      onUpdatePromoter(editingPromoter.id, promoterData);
    } else {
      onAddPromoter(promoterData);
    }

    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (promoter: Promoter) => {
    setForm({
      name: promoter.name,
      email: promoter.email,
      phone: promoter.phone,
      guestQuota: promoter.guestQuota?.toString() || "",
      permissions: { ...promoter.permissions },
    });
    setEditingPromoter(promoter);
    setShowAddModal(true);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Promoters do Evento
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 text-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar Promoter
        </button>
      </div>

      {promoters.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum promoter adicionado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promoters.map((promoter) => (
            <div
              key={promoter.id}
              className="p-4 rounded-lg border bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1">
                    {promoter.name}
                  </h3>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {promoter.email}
                    </p>
                    {promoter.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {promoter.phone}
                      </p>
                    )}
                    <p className="text-purple-400">
                      {promoter.guestsAdded} convidados adicionados
                      {promoter.guestQuota && ` / ${promoter.guestQuota} limite`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleEdit(promoter)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 rounded-lg transition-all duration-300 text-xs sm:text-sm flex-1 sm:flex-initial justify-center"
                  >
                    <Settings className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => onDeletePromoter(promoter.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Promoter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-purple-500/30 p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingPromoter ? "Editar Promoter" : "Adicionar Promoter"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Informações Básicas */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Nome do promoter"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefone (opcional)
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Limite de Convidados (opcional)
                </label>
                <input
                  type="number"
                  value={form.guestQuota}
                  onChange={(e) => setForm({ ...form, guestQuota: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Deixe vazio para sem limite"
                  min="0"
                />
              </div>

              {/* Permissões */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Permissões</h4>
                <div className="space-y-2">
                  {[
                    { key: "canAddGuests", label: "Adicionar convidados" },
                    { key: "canConfirmGuests", label: "Confirmar convidados" },
                    { key: "canCheckInGuests", label: "Fazer check-in" },
                    { key: "canViewAllGuests", label: "Ver todos os convidados" },
                    { key: "canEditGuests", label: "Editar convidados" },
                    { key: "canDeleteGuests", label: "Remover convidados" },
                  ].map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.permissions[perm.key as keyof PromoterPermissions]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            permissions: {
                              ...form.permissions,
                              [perm.key]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-sm text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.email}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingPromoter ? "Salvar Alterações" : "Adicionar Promoter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
