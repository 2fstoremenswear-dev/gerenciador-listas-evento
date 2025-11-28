"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, MapPin, Users, CheckCircle, Loader2 } from "lucide-react";
import { Event, Promoter, DEFAULT_PROMOTER_PERMISSIONS } from "@/lib/types";
import { storage } from "@/lib/storage";

export default function PromoterInvitePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    instagram: "",
  });

  useEffect(() => {
    const events = storage.getEvents();
    const foundEvent = events.find((e) => e.id === eventId);
    setEvent(foundEvent || null);
    setLoading(false);
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!form.name || !form.phone) {
      setError("Nome e telefone são obrigatórios");
      setSubmitting(false);
      return;
    }

    if (!event) {
      setError("Evento não encontrado");
      setSubmitting(false);
      return;
    }

    try {
      // Cria novo promoter
      const newPromoter: Promoter = {
        id: `promoter-${Date.now()}`,
        userId: `user-${Date.now()}`, // Gera ID temporário
        eventId: event.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        permissions: DEFAULT_PROMOTER_PERMISSIONS,
        guestsAdded: 0,
        createdAt: Date.now(),
        invitedBy: event.ownerId,
      };

      // Atualiza evento com novo promoter
      const events = storage.getEvents();
      const updatedEvents = events.map((e) =>
        e.id === event.id
          ? { ...e, promoters: [...e.promoters, newPromoter] }
          : e
      );

      storage.saveEvents(updatedEvents);
      setSuccess(true);

      // Redireciona após 3 segundos
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      setError("Erro ao cadastrar promoter. Tente novamente.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Evento não encontrado</h1>
          <p className="text-gray-400 mb-6">
            O evento que você está procurando não existe ou foi removido.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-green-500/30 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Cadastro realizado com sucesso!
          </h1>
          <p className="text-gray-400 mb-6">
            Você agora é promoter do evento <strong className="text-white">{event.name}</strong>.
            O organizador entrará em contato com mais informações.
          </p>
          <div className="text-sm text-gray-500">
            Redirecionando em alguns segundos...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 sm:p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Seja um Promoter</h1>
          <p className="text-gray-400 text-sm">
            Cadastre-se para trazer convidados para este evento
          </p>
        </div>

        {/* Event Info */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 mb-6">
          <h2 className="font-semibold text-white mb-3">{event.name}</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(event.date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {event.location}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome completo *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Seu nome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email (opcional)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instagram (opcional)
            </label>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="@seuinstagram"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              "Cadastrar como Promoter"
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Ao se cadastrar, você poderá adicionar convidados à lista do evento
        </p>
      </div>
    </div>
  );
}
