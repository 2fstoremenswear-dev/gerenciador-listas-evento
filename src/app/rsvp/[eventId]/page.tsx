"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, MapPin, CheckCircle, Loader2, PartyPopper } from "lucide-react";
import { Event, Guest } from "@/lib/types";
import { storage } from "@/lib/storage";
import { generateConfirmationToken, generateConfirmationCode } from "@/lib/confirmation";

export default function RSVPPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    listType: "Normal" as "Normal" | "VIP" | "Parceiros",
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

    // Verifica capacidade
    const confirmedCount = event.guests.filter((g) => g.confirmed).length;
    if (confirmedCount >= event.maxCapacity) {
      setError("Desculpe, o evento já atingiu a capacidade máxima.");
      setSubmitting(false);
      return;
    }

    try {
      const code = generateConfirmationCode();
      
      // Cria novo convidado
      const newGuest: Guest = {
        id: `guest-${Date.now()}`,
        name: form.name,
        phone: form.phone,
        email: form.email,
        confirmed: false,
        checkedIn: false,
        listType: form.listType,
        timestamp: Date.now(),
        addedBy: event.ownerId, // Adicionado pelo link público
        confirmationToken: generateConfirmationToken(),
        confirmationCode: code,
      };

      // Atualiza evento com novo convidado
      const events = storage.getEvents();
      const updatedEvents = events.map((e) =>
        e.id === event.id
          ? { ...e, guests: [...e.guests, newGuest] }
          : e
      );

      storage.saveEvents(updatedEvents);
      setConfirmationCode(code);
      setSuccess(true);
    } catch (err) {
      setError("Erro ao adicionar à lista. Tente novamente.");
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
            O evento que você está procurando não existe ou foi encerrado.
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
            <PartyPopper className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Você está na lista!
          </h1>
          <p className="text-gray-400 mb-6">
            Seu nome foi adicionado à lista do evento <strong className="text-white">{event.name}</strong>.
          </p>

          {/* Código de confirmação */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Seu código de confirmação:</p>
            <p className="text-2xl font-bold text-purple-300 tracking-wider">
              {confirmationCode}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Guarde este código para confirmar sua presença
            </p>
          </div>

          <div className="text-sm text-gray-400 space-y-2">
            <p>✅ Você receberá mais informações em breve</p>
            <p>✅ O organizador pode entrar em contato via telefone/email</p>
          </div>

          <button
            onClick={() => router.push(`/confirm/${confirmationCode}`)}
            className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300"
          >
            Confirmar presença agora
          </button>
        </div>
      </div>
    );
  }

  const confirmedCount = event.guests.filter((g) => g.confirmed).length;
  const remainingSpots = event.maxCapacity - confirmedCount;
  const isFull = remainingSpots <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6 sm:p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Entre na Lista</h1>
          <p className="text-gray-400 text-sm">
            Coloque seu nome na lista deste evento
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

          {/* Availability */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Vagas disponíveis:</span>
              <span className={`font-semibold ${isFull ? "text-red-400" : "text-green-400"}`}>
                {isFull ? "Esgotado" : `${remainingSpots} vagas`}
              </span>
            </div>
          </div>
        </div>

        {isFull ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-300 font-medium">
              Desculpe, o evento já atingiu a capacidade máxima.
            </p>
          </div>
        ) : (
          <>
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
                    Adicionando...
                  </>
                ) : (
                  "Adicionar à Lista"
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6">
              Ao se cadastrar, você receberá um código de confirmação
            </p>
          </>
        )}
      </div>
    </div>
  );
}
