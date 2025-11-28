// Componente de seleção de papel do usuário (simulação de login)

"use client";

import { useState } from "react";
import { User, UserRole, Guest, Event } from "@/lib/types";
import { Crown, Users, UserCircle, X, CheckCircle, Calendar, MapPin, User as UserIcon } from "lucide-react";
import { storage } from "@/lib/storage";
import { findGuestByCode } from "@/lib/confirmation";

interface RoleSelectorProps {
  onSelectRole: (user: User) => void;
}

export default function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const [showGuestLogin, setShowGuestLogin] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [guestData, setGuestData] = useState<{ guest: Guest; event: Event } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createUser = (role: UserRole, name: string) => {
    const user: User = {
      id: `${role}-${Date.now()}`,
      name,
      email: `${name.toLowerCase().replace(/\s/g, "")}@example.com`,
      phone: "",
      role,
      createdAt: Date.now(),
    };
    onSelectRole(user);
  };

  const handleGuestAccess = () => {
    if (!confirmationCode.trim()) {
      setError("Por favor, digite o código de confirmação");
      return;
    }

    const events = storage.getEvents();
    const result = findGuestByCode(events, confirmationCode.trim().toUpperCase());

    if (!result) {
      setError("Código inválido ou não encontrado");
      setGuestData(null);
      return;
    }

    setError("");
    setGuestData(result);
  };

  const handleConfirmPresence = () => {
    if (!guestData) return;

    const events = storage.getEvents();
    const updatedEvents = events.map((event) => {
      if (event.id === guestData.event.id) {
        return {
          ...event,
          guests: event.guests.map((guest) =>
            guest.id === guestData.guest.id
              ? { ...guest, confirmed: true, confirmedAt: Date.now() }
              : guest
          ),
        };
      }
      return event;
    });

    storage.saveEvents(updatedEvents);
    setSuccess(true);

    // Atualiza os dados locais
    const updatedGuest = { ...guestData.guest, confirmed: true, confirmedAt: Date.now() };
    setGuestData({ ...guestData, guest: updatedGuest });
  };

  const getStatusText = (guest: Guest) => {
    if (guest.checkedIn) return "Check-in realizado";
    if (guest.confirmed) return "Confirmado";
    return "Pendente";
  };

  const getStatusColor = (guest: Guest) => {
    if (guest.checkedIn) return "text-blue-400";
    if (guest.confirmed) return "text-green-400";
    return "text-yellow-400";
  };

  const roles = [
    {
      role: "owner" as UserRole,
      title: "Dono do Evento",
      description: "Crie e gerencie eventos, adicione promoters e controle tudo",
      icon: Crown,
      color: "from-purple-600 to-purple-400",
      borderColor: "border-purple-500/50",
      bgColor: "bg-purple-500/10",
    },
    {
      role: "promoter" as UserRole,
      title: "Promoter",
      description: "Adicione convidados e gerencie sua lista dentro do evento",
      icon: Users,
      color: "from-blue-600 to-blue-400",
      borderColor: "border-blue-500/50",
      bgColor: "bg-blue-500/10",
    },
    {
      role: "guest" as UserRole,
      title: "Convidado",
      description: "Visualize suas informações e status de confirmação",
      icon: UserCircle,
      color: "from-green-600 to-green-400",
      borderColor: "border-green-500/50",
      bgColor: "bg-green-500/10",
      onClick: () => setShowGuestLogin(true),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
            Nome na Lista Pro
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Selecione seu papel para começar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {roles.map((roleData) => {
            const Icon = roleData.icon;
            return (
              <button
                key={roleData.role}
                onClick={() => 
                  roleData.onClick 
                    ? roleData.onClick() 
                    : createUser(roleData.role, `Usuário ${roleData.title}`)
                }
                className={`group relative bg-gray-900/50 backdrop-blur-sm rounded-xl border ${roleData.borderColor} p-6 sm:p-8 hover:scale-105 transition-all duration-300 text-left`}
              >
                <div
                  className={`absolute inset-0 ${roleData.bgColor} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${roleData.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {roleData.title}
                  </h3>
                  <p className="text-sm text-gray-400">{roleData.description}</p>

                  <div className="mt-4 sm:mt-6 flex items-center gap-2 text-sm font-medium">
                    <span
                      className={`bg-gradient-to-r ${roleData.color} bg-clip-text text-transparent`}
                    >
                      Entrar como {roleData.title}
                    </span>
                    <span className="text-gray-600 group-hover:text-gray-400 transition-colors">
                      →
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            💡 Esta é uma simulação de login. Em produção, haverá autenticação real.
          </p>
        </div>
      </div>

      {/* Modal de Login do Convidado */}
      {showGuestLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-green-500/30 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-green-400" />
                Acesso de Convidado
              </h3>
              <button
                onClick={() => {
                  setShowGuestLogin(false);
                  setConfirmationCode("");
                  setGuestData(null);
                  setError("");
                  setSuccess(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!guestData ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Confirmação
                  </label>
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => {
                      setConfirmationCode(e.target.value.toUpperCase());
                      setError("");
                    }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors uppercase"
                    placeholder="Ex: CONF-ABC123"
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-400">{error}</p>
                  )}
                </div>

                <button
                  onClick={handleGuestAccess}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
                >
                  Acessar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {success && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-300">
                      Presença confirmada com sucesso!
                    </p>
                  </div>
                )}

                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Evento</span>
                  </div>
                  <h4 className="text-lg font-bold text-white">{guestData.event.name}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(guestData.event.date).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{guestData.event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Seus Dados</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Nome</p>
                      <p className="text-white font-medium">{guestData.guest.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Tipo de Lista</p>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/50">
                        {guestData.guest.listType}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className={`font-medium ${getStatusColor(guestData.guest)}`}>
                        {getStatusText(guestData.guest)}
                      </p>
                    </div>
                  </div>
                </div>

                {!guestData.guest.confirmed && (
                  <button
                    onClick={handleConfirmPresence}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Presença
                  </button>
                )}

                {guestData.guest.confirmed && !success && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-300">
                      Sua presença já foi confirmada!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
