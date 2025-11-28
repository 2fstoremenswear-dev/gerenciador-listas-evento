"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Calendar,
  MapPin,
  Trash2,
  UserCheck,
  X,
  LogOut,
  Crown,
  UserCircle,
  CheckCircle,
  Link as LinkIcon,
  Check,
  Copy,
} from "lucide-react";
import { User, Event, Guest, Promoter, DEFAULT_PROMOTER_PERMISSIONS } from "@/lib/types";
import { storage } from "@/lib/storage";
import { usePermissions, getFilteredGuests, getPromoterStats } from "@/lib/permissions";
import RoleSelector from "@/components/RoleSelector";
import PromoterManager from "@/components/PromoterManager";
import { generateConfirmationToken, generateConfirmationCode, copyToClipboard } from "@/lib/confirmation";

export default function NomeNaListaPro() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showPromoterManager, setShowPromoterManager] = useState(false);
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    name: "",
    date: "",
    location: "",
    maxCapacity: 100,
  });

  const [guestForm, setGuestForm] = useState({
    name: "",
    phone: "",
    email: "",
    listType: "Normal" as "Normal" | "VIP" | "Parceiros",
  });

  // Permissions
  const permissions = usePermissions(currentUser, selectedEvent);

  // Load from localStorage e normaliza códigos de confirmação
  useEffect(() => {
    const user = storage.getCurrentUser();
    let storedEvents = storage.getEvents();

    // Normaliza convidados antigos sem confirmationCode
    let needsSave = false;
    storedEvents = storedEvents.map((event) => {
      const updatedGuests = event.guests.map((guest) => {
        if (!guest.confirmationCode) {
          needsSave = true;
          return {
            ...guest,
            confirmationCode: generateConfirmationCode(),
          };
        }
        return guest;
      });
      return { ...event, guests: updatedGuests };
    });

    if (needsSave) {
      storage.saveEvents(storedEvents);
    }

    setCurrentUser(user);
    setEvents(storedEvents);

    if (storedEvents.length > 0 && user) {
      // Seleciona primeiro evento que o usuário tem acesso
      const accessibleEvent = storedEvents.find(
        (e) =>
          e.ownerId === user.id ||
          e.promoters.some((p) => p.userId === user.id)
      );
      setSelectedEvent(accessibleEvent || null);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (events.length > 0) {
      storage.saveEvents(events);
    }
  }, [events]);

  useEffect(() => {
    if (currentUser) {
      storage.setCurrentUser(currentUser);
    }
  }, [currentUser]);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setCurrentUser(user);
    storage.setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedEvent(null);
    storage.setCurrentUser(null);
  };

  // Create Event (apenas owner)
  const handleCreateEvent = () => {
    if (!currentUser || currentUser.role !== "owner") return;
    if (!eventForm.name || !eventForm.date || !eventForm.location) return;

    const newEvent: Event = {
      id: Date.now().toString(),
      name: eventForm.name,
      date: eventForm.date,
      location: eventForm.location,
      maxCapacity: eventForm.maxCapacity,
      guests: [],
      promoters: [],
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      createdAt: Date.now(),
      settings: {
        allowPromoterInvites: true,
        requireOwnerApproval: false,
        enableCheckIn: true,
      },
    };

    setEvents([...events, newEvent]);
    setSelectedEvent(newEvent);
    setEventForm({ name: "", date: "", location: "", maxCapacity: 100 });
    setShowCreateEvent(false);
  };

  // Add Guest
  const handleAddGuest = () => {
    if (!selectedEvent || !currentUser || !guestForm.name) return;
    if (!permissions.canAddGuests) return;

    // Verifica quota do promoter
    if (permissions.isPromoter && permissions.promoterData) {
      const stats = getPromoterStats(permissions.promoterData, selectedEvent);
      if (stats.hasQuota && stats.remaining !== null && stats.remaining <= 0) {
        alert("Você atingiu seu limite de convidados!");
        return;
      }
    }

    const newGuest: Guest = {
      id: Date.now().toString(),
      name: guestForm.name,
      phone: guestForm.phone,
      email: guestForm.email,
      confirmed: false,
      checkedIn: false,
      listType: guestForm.listType,
      timestamp: Date.now(),
      addedBy: permissions.isPromoter ? permissions.promoterData!.id : currentUser.id,
      promoterId: permissions.isPromoter ? permissions.promoterData!.id : undefined,
      confirmationToken: generateConfirmationToken(),
      confirmationCode: generateConfirmationCode(),
    };

    const updatedEvents = events.map((event) => {
      if (event.id === selectedEvent.id) {
        // Atualiza contador do promoter se aplicável
        const updatedPromoters = permissions.isPromoter
          ? event.promoters.map((p) =>
              p.id === permissions.promoterData!.id
                ? { ...p, guestsAdded: p.guestsAdded + 1 }
                : p
            )
          : event.promoters;

        return {
          ...event,
          guests: [...event.guests, newGuest],
          promoters: updatedPromoters,
        };
      }
      return event;
    });

    setEvents(updatedEvents);
    setSelectedEvent(
      updatedEvents.find((e) => e.id === selectedEvent.id) || selectedEvent
    );
    setGuestForm({ name: "", phone: "", email: "", listType: "Normal" });
    setShowAddGuest(false);
  };

  // Toggle Guest Confirmation
  const toggleGuestConfirmation = (guestId: string) => {
    if (!selectedEvent || !permissions.canConfirmGuests) return;

    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id
        ? {
            ...event,
            guests: event.guests.map((guest) =>
              guest.id === guestId ? { ...guest, confirmed: !guest.confirmed } : guest
            ),
          }
        : event
    );

    setEvents(updatedEvents);
    const updated = updatedEvents.find((e) => e.id === selectedEvent.id);
    if (updated) setSelectedEvent(updated);
  };

  // Toggle Check-in
  const toggleCheckIn = (guestId: string) => {
    if (!selectedEvent || !permissions.canCheckInGuests) return;

    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id
        ? {
            ...event,
            guests: event.guests.map((guest) =>
              guest.id === guestId ? { ...guest, checkedIn: !guest.checkedIn } : guest
            ),
          }
        : event
    );

    setEvents(updatedEvents);
    const updated = updatedEvents.find((e) => e.id === selectedEvent.id);
    if (updated) setSelectedEvent(updated);
  };

  // Delete Guest
  const deleteGuest = (guestId: string) => {
    if (!selectedEvent || !permissions.canDeleteGuests) return;

    const guest = selectedEvent.guests.find((g) => g.id === guestId);
    if (!guest) return;

    const updatedEvents = events.map((event) => {
      if (event.id === selectedEvent.id) {
        // Decrementa contador do promoter se aplicável
        const updatedPromoters =
          guest.promoterId
            ? event.promoters.map((p) =>
                p.id === guest.promoterId
                  ? { ...p, guestsAdded: Math.max(0, p.guestsAdded - 1) }
                  : p
              )
            : event.promoters;

        return {
          ...event,
          guests: event.guests.filter((g) => g.id !== guestId),
          promoters: updatedPromoters,
        };
      }
      return event;
    });

    setEvents(updatedEvents);
    const updated = updatedEvents.find((e) => e.id === selectedEvent.id);
    if (updated) setSelectedEvent(updated);
  };

  // Delete Event (apenas owner)
  const deleteEvent = (eventId: string) => {
    if (!permissions.canDeleteEvent) return;

    const filtered = events.filter((e) => e.id !== eventId);
    setEvents(filtered);
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(filtered[0] || null);
    }
  };

  // Promoter Management (apenas owner)
  const handleAddPromoter = (
    promoterData: Omit<Promoter, "id" | "createdAt" | "guestsAdded">
  ) => {
    if (!selectedEvent || !permissions.canManagePromoters) return;

    const newPromoter: Promoter = {
      ...promoterData,
      id: `promoter-${Date.now()}`,
      createdAt: Date.now(),
      guestsAdded: 0,
    };

    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id
        ? { ...event, promoters: [...event.promoters, newPromoter] }
        : event
    );

    setEvents(updatedEvents);
    setSelectedEvent(
      updatedEvents.find((e) => e.id === selectedEvent.id) || selectedEvent
    );
  };

  const handleUpdatePromoter = (promoterId: string, updates: Partial<Promoter>) => {
    if (!selectedEvent || !permissions.canManagePromoters) return;

    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id
        ? {
            ...event,
            promoters: event.promoters.map((p) =>
              p.id === promoterId ? { ...p, ...updates } : p
            ),
          }
        : event
    );

    setEvents(updatedEvents);
    setSelectedEvent(
      updatedEvents.find((e) => e.id === selectedEvent.id) || selectedEvent
    );
  };

  const handleDeletePromoter = (promoterId: string) => {
    if (!selectedEvent || !permissions.canManagePromoters) return;

    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id
        ? { ...event, promoters: event.promoters.filter((p) => p.id !== promoterId) }
        : event
    );

    setEvents(updatedEvents);
    setSelectedEvent(
      updatedEvents.find((e) => e.id === selectedEvent.id) || selectedEvent
    );
  };

  // Calculate stats
  const getEventStats = (event: Event) => {
    const confirmedCount = event.guests.filter((g) => g.confirmed).length;
    const checkedInCount = event.guests.filter((g) => g.checkedIn).length;
    const totalGuests = event.guests.length;
    const remainingSpots = event.maxCapacity - confirmedCount;
    const fillPercentage = (confirmedCount / event.maxCapacity) * 100;

    let status: "Aberta" | "Quase Encerrada" | "Encerrada" = "Aberta";
    if (fillPercentage >= 100) status = "Encerrada";
    else if (fillPercentage >= 80) status = "Quase Encerrada";

    return {
      confirmedCount,
      checkedInCount,
      totalGuests,
      remainingSpots,
      fillPercentage,
      status,
    };
  };

  const getListTypeColor = (type: string) => {
    switch (type) {
      case "VIP":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      case "Parceiros":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Encerrada":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "Quase Encerrada":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      default:
        return "bg-green-500/20 text-green-300 border-green-500/50";
    }
  };

  const stats = selectedEvent ? getEventStats(selectedEvent) : null;
  const filteredGuests = selectedEvent ? getFilteredGuests(selectedEvent, currentUser, permissions) : [];

  // Get accessible events for current user
  const accessibleEvents = events.filter((event) => {
    if (!currentUser) return false;
    if (currentUser.role === "owner") return event.ownerId === currentUser.id;
    if (currentUser.role === "promoter") {
      return event.promoters.some((p) => p.userId === currentUser.id);
    }
    return false;
  });

  // Se não tiver usuário, mostra seletor de papel
  if (!currentUser) {
    return <RoleSelector onSelectRole={handleUserSelect} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Nome na Lista Pro
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Gerenciamento de listas para eventos
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                {currentUser.role === "owner" ? (
                  <Crown className="w-4 h-4 text-purple-400" />
                ) : currentUser.role === "promoter" ? (
                  <Users className="w-4 h-4 text-blue-400" />
                ) : (
                  <UserCircle className="w-4 h-4 text-green-400" />
                )}
                <span className="text-sm text-white">{currentUser.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300 border border-red-500/50"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  {permissions.isOwner ? "Meus Eventos" : "Eventos"}
                </h2>
                {permissions.isOwner && (
                  <button
                    onClick={() => setShowCreateEvent(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar evento</span>
                  </button>
                )}
              </div>

              {accessibleEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-4">
                    {permissions.isOwner
                      ? "Você ainda não criou nenhum evento."
                      : "Você não está em nenhum evento."}
                  </p>

                  {permissions.isOwner && (
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                      Criar meu primeiro evento
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {accessibleEvents.map((event) => {
                    const eventStats = getEventStats(event);
                    const isOwner = event.ownerId === currentUser.id;
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                          selectedEvent?.id === event.id
                            ? "bg-purple-500/20 border-purple-500"
                            : "bg-gray-800/50 border-gray-700 hover:border-purple-500/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm sm:text-base">
                              {event.name}
                            </h3>
                            {isOwner && (
                              <span className="inline-flex items-center gap-1 text-xs text-purple-400 mt-1">
                                <Crown className="w-3 h-3" />
                                Dono
                              </span>
                            )}
                          </div>
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEvent(event.id);
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-gray-400">
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                          <p className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {eventStats.confirmedCount}/{event.maxCapacity} confirmados
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                              eventStats.status
                            )}`}
                          >
                            {eventStats.status}
                          </span>
                          {event.promoters.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {event.promoters.length} promoter(s)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Event Details & Guest List */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-4">
                    <p className="text-xs sm:text-sm text-purple-300 mb-1">Confirmados</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">
                      {stats?.confirmedCount}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl border border-blue-500/30 p-4">
                    <p className="text-xs sm:text-sm text-blue-300 mb-1">Check-in</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">
                      {stats?.checkedInCount}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-4">
                    <p className="text-xs sm:text-sm text-green-300 mb-1">Vagas</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">
                      {stats?.remainingSpots}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-sm rounded-xl border border-pink-500/30 p-4">
                    <p className="text-xs sm:text-sm text-pink-300 mb-1">Ocupação</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">
                      {Math.round(stats?.fillPercentage || 0)}%
                    </p>
                  </div>
                </div>

                {/* Promoter Stats (se for promoter) */}
                {permissions.isPromoter && permissions.promoterData && (
                  <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl border border-blue-500/30 p-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">
                      Suas Estatísticas
                    </h3>
                    {(() => {
                      const promoterStats = getPromoterStats(
                        permissions.promoterData,
                        selectedEvent
                      );
                      return (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-white">
                              {promoterStats.total}
                            </p>
                            <p className="text-xs text-gray-400">Convidados</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">
                              {promoterStats.confirmed}
                            </p>
                            <p className="text-xs text-gray-400">Confirmados</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">
                              {promoterStats.hasQuota
                                ? promoterStats.remaining
                                : "∞"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {promoterStats.hasQuota ? "Restantes" : "Sem limite"}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Links do Evento (apenas para owner) */}
                {permissions.isOwner && (
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-purple-400" />
                      Links do Evento
                    </h3>
                    <div className="space-y-4">
                      {/* Link para Promoters */}
                      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                        <h4 className="font-semibold text-white mb-1">Convidar Promoters</h4>
                        <p className="text-xs text-gray-400 mb-3">
                          Envie este link para quem vai trazer convidados para o seu evento.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-gray-300"
                            value={`/promoter/invite/${selectedEvent.id}`}
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const success = await copyToClipboard(
                                `${window.location.origin}/promoter/invite/${selectedEvent.id}`
                              );
                              if (success) {
                                alert("Link copiado!");
                              }
                            }}
                            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded text-white transition-all duration-300 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar
                          </button>
                        </div>
                      </div>

                      {/* Link para Convidados */}
                      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                        <h4 className="font-semibold text-white mb-1">Link para Convidados</h4>
                        <p className="text-xs text-gray-400 mb-3">
                          Envie este link para o público colocar o nome na lista.
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-gray-300"
                            value={`/rsvp/${selectedEvent.id}`}
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const success = await copyToClipboard(
                                `${window.location.origin}/rsvp/${selectedEvent.id}`
                              );
                              if (success) {
                                alert("Link copiado!");
                              }
                            }}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded text-white transition-all duration-300 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Promoter Manager (apenas owner) */}
                {permissions.canManagePromoters && (
                  <PromoterManager
                    eventId={selectedEvent.id}
                    promoters={selectedEvent.promoters}
                    ownerId={currentUser.id}
                    onAddPromoter={handleAddPromoter}
                    onUpdatePromoter={handleUpdatePromoter}
                    onDeletePromoter={handleDeletePromoter}
                  />
                )}

                {/* Guest List */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Lista de Convidados
                      {!permissions.canViewAllGuests && permissions.isPromoter && (
                        <span className="text-xs text-gray-500">(seus convidados)</span>
                      )}
                    </h2>
                    {permissions.canAddGuests && (
                      <button
                        onClick={() => setShowAddGuest(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Convidado
                      </button>
                    )}
                  </div>

                  {filteredGuests.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {permissions.canAddGuests
                          ? "Nenhum convidado na lista ainda"
                          : "Você não tem permissão para ver a lista"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredGuests.map((guest) => {
                        const isCopied = copiedGuestId === guest.id;

                        return (
                          <div
                            key={guest.id}
                            className={`p-4 rounded-lg border transition-all duration-300 ${
                              guest.checkedIn
                                ? "bg-blue-500/10 border-blue-500/30"
                                : guest.confirmed
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-gray-800/50 border-gray-700"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold text-white text-sm sm:text-base">
                                    {guest.name}
                                  </h3>
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getListTypeColor(
                                      guest.listType
                                    )}`}
                                  >
                                    {guest.listType}
                                  </span>
                                  {guest.checkedIn && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/50">
                                      <CheckCircle className="w-3 h-3" />
                                      Check-in
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  {guest.phone && (
                                    <p className="text-xs sm:text-sm text-gray-400">
                                      {guest.phone}
                                    </p>
                                  )}
                                  {guest.email && (
                                    <p className="text-xs sm:text-sm text-gray-400">
                                      {guest.email}
                                    </p>
                                  )}
                                </div>

                                {/* Link de confirmação (apenas para owner/promoter) */}
                                {(permissions.isOwner || permissions.isPromoter) && guest.confirmationCode && (
                                  <div className="mt-2">
                                    <p className="text-[11px] text-gray-500 mb-1">Link de confirmação:</p>
                                    <div className="flex items-center gap-2">
                                      <input
                                        readOnly
                                        className="flex-1 px-2 py-1 text-[11px] bg-gray-800 border border-gray-700 rounded"
                                        value={`/confirm/${guest.confirmationCode}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const success = await copyToClipboard(
                                            `${window.location.origin}/confirm/${guest.confirmationCode}`
                                          );
                                          if (success) {
                                            setCopiedGuestId(guest.id);
                                            setTimeout(() => setCopiedGuestId(null), 2000);
                                          }
                                        }}
                                        className={`px-2 py-1 text-[11px] rounded text-white transition-all duration-300 ${
                                          isCopied
                                            ? "bg-green-600 hover:bg-green-500"
                                            : "bg-purple-600 hover:bg-purple-500"
                                        }`}
                                      >
                                        {isCopied ? "Copiado!" : "Copiar"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                                {permissions.canCheckInGuests && (
                                  <button
                                    onClick={() => toggleCheckIn(guest.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-xs sm:text-sm ${
                                      guest.checkedIn
                                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30"
                                        : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                                    }`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    {guest.checkedIn ? "Check-in" : "Check-in"}
                                  </button>
                                )}
                                {permissions.canConfirmGuests && (
                                  <button
                                    onClick={() => toggleGuestConfirmation(guest.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 flex-1 sm:flex-initial justify-center text-xs sm:text-sm ${
                                      guest.confirmed
                                        ? "bg-green-500/20 text-green-300 border border-green-500/50 hover:bg-green-500/30"
                                        : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                                    }`}
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    {guest.confirmed ? "Confirmado" : "Confirmar"}
                                  </button>
                                )}
                                {permissions.canDeleteGuests && (
                                  <button
                                    onClick={() => deleteGuest(guest.id)}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Selecione um evento</h3>
                <p className="text-gray-400">
                  {permissions.isOwner
                    ? "Escolha um evento da lista ou crie um novo"
                    : "Escolha um evento da lista"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && permissions.isOwner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-purple-500/30 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Criar Novo Evento</h3>
              <button
                onClick={() => setShowCreateEvent(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Evento
                </label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: Festa de Aniversário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Local</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, location: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ex: Clube XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Capacidade Máxima
                </label>
                <input
                  type="number"
                  value={eventForm.maxCapacity}
                  onChange={(e) =>
                    setEventForm({
                      ...eventForm,
                      maxCapacity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  min="1"
                />
              </div>

              <button
                onClick={handleCreateEvent}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
              >
                Criar Evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      {showAddGuest && permissions.canAddGuests && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl border border-purple-500/30 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Adicionar Convidado</h3>
              <button
                onClick={() => setShowAddGuest(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone (opcional)
                </label>
                <input
                  type="tel"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Lista
                </label>
                <select
                  value={guestForm.listType}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      listType: e.target.value as "Normal" | "VIP" | "Parceiros",
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="Normal">Normal</option>
                  <option value="VIP">VIP</option>
                  <option value="Parceiros">Parceiros</option>
                </select>
              </div>

              <button
                onClick={handleAddGuest}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
              >
                Adicionar à Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
