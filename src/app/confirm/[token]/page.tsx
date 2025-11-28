"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { storage } from "@/lib/storage";
import { Event, Guest } from "@/lib/types";

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Código de confirmação inválido");
      setLoading(false);
      return;
    }

    // Busca o convidado pelo confirmationCode
    const events = storage.getEvents();
    let foundGuest: Guest | null = null;
    let foundEvent: Event | null = null;

    for (const evt of events) {
      const guestMatch = evt.guests.find(g => g.confirmationCode === token);
      if (guestMatch) {
        foundGuest = guestMatch;
        foundEvent = evt;
        break;
      }
    }

    if (!foundGuest || !foundEvent) {
      setError("Código inválido ou convite não encontrado.");
      setLoading(false);
      return;
    }

    setGuest(foundGuest);
    setEvent(foundEvent);
    setLoading(false);
  }, [token]);

  const handleConfirm = () => {
    if (!guest || !event) return;

    // Atualiza o status de confirmação
    const events = storage.getEvents();
    const updatedEvents = events.map((e) => {
      if (e.id === event.id) {
        return {
          ...e,
          guests: e.guests.map((g) =>
            g.id === guest.id 
              ? { ...g, confirmed: true, confirmedAt: Date.now() } 
              : g
          ),
        };
      }
      return e;
    });

    storage.saveEvents(updatedEvents);
    setSuccess(true);
  };

  const handleDecline = () => {
    if (!guest || !event) return;

    // Remove o convidado da lista
    const events = storage.getEvents();
    const updatedEvents = events.map((e) => {
      if (e.id === event.id) {
        return {
          ...e,
          guests: e.guests.filter((g) => g.id !== guest.id),
        };
      }
      return e;
    });

    storage.saveEvents(updatedEvents);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Ops!</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-green-500/30 p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Presença Confirmada!</h1>
          <p className="text-gray-400 mb-2">
            Sua presença foi confirmada com sucesso para o evento:
          </p>
          <p className="text-xl font-semibold text-purple-400 mb-6">{event?.name}</p>
          
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm">
                {event && new Date(event.date).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-sm">{event?.location}</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-6">
            Nos vemos lá! 🎉
          </p>

          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (guest?.confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Já Confirmado!</h1>
          <p className="text-gray-400 mb-2">
            Você já confirmou presença para este evento:
          </p>
          <p className="text-xl font-semibold text-purple-400 mb-6">{event?.name}</p>
          
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm">
                {event && new Date(event.date).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-sm">{event?.location}</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Você foi convidado!
          </h1>
          <p className="text-gray-400">Confirme sua presença no evento</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 mb-6 space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Evento</p>
            <p className="text-lg sm:text-xl font-bold text-white">{event?.name}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm">
                {event && new Date(event.date).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-sm">{event?.location}</span>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400 mb-1">Convidado</p>
            <p className="text-base font-semibold text-white">{guest?.name}</p>
            {guest?.listType && (
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  guest.listType === "VIP"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                    : guest.listType === "Parceiros"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                    : "bg-gray-500/20 text-gray-300 border border-gray-500/50"
                }`}
              >
                Lista {guest.listType}
              </span>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400 mb-1">Status</p>
            <p className="text-base font-semibold text-yellow-400">
              {guest?.confirmed ? "Confirmado" : "Pendente"}
            </p>
          </div>
        </div>

        {!guest?.confirmed && (
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold text-lg transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
            >
              <CheckCircle className="w-6 h-6" />
              Confirmar Presença
            </button>

            <button
              onClick={handleDecline}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-all duration-300"
            >
              <XCircle className="w-5 h-5" />
              Não Poderei Ir
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          Ao confirmar, você estará garantindo sua vaga no evento.
        </p>
      </div>
    </div>
  );
}
