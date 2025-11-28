// Hooks customizados para gerenciar permissões e lógica de papéis

import { User, Event, Promoter, PromoterPermissions } from "./types";

export function usePermissions(currentUser: User | null, event: Event | null) {
  if (!currentUser || !event) {
    return {
      isOwner: false,
      isPromoter: false,
      isGuest: false,
      canAddGuests: false,
      canConfirmGuests: false,
      canCheckInGuests: false,
      canViewAllGuests: false,
      canEditGuests: false,
      canDeleteGuests: false,
      canManagePromoters: false,
      canEditEvent: false,
      canDeleteEvent: false,
      promoterData: null as Promoter | null,
    };
  }

  const isOwner = event.ownerId === currentUser.id;
  const promoterData = event.promoters.find((p) => p.userId === currentUser.id);
  const isPromoter = !!promoterData;
  const isGuest = currentUser.role === "guest";

  // Owner tem todas as permissões
  if (isOwner) {
    return {
      isOwner: true,
      isPromoter: false,
      isGuest: false,
      canAddGuests: true,
      canConfirmGuests: true,
      canCheckInGuests: true,
      canViewAllGuests: true,
      canEditGuests: true,
      canDeleteGuests: true,
      canManagePromoters: true,
      canEditEvent: true,
      canDeleteEvent: true,
      promoterData: null,
    };
  }

  // Promoter tem permissões configuradas
  if (isPromoter && promoterData) {
    return {
      isOwner: false,
      isPromoter: true,
      isGuest: false,
      canAddGuests: promoterData.permissions.canAddGuests,
      canConfirmGuests: promoterData.permissions.canConfirmGuests,
      canCheckInGuests: promoterData.permissions.canCheckInGuests,
      canViewAllGuests: promoterData.permissions.canViewAllGuests,
      canEditGuests: promoterData.permissions.canEditGuests,
      canDeleteGuests: promoterData.permissions.canDeleteGuests,
      canManagePromoters: false,
      canEditEvent: false,
      canDeleteEvent: false,
      promoterData,
    };
  }

  // Guest não tem permissões
  return {
    isOwner: false,
    isPromoter: false,
    isGuest: true,
    canAddGuests: false,
    canConfirmGuests: false,
    canCheckInGuests: false,
    canViewAllGuests: false,
    canEditGuests: false,
    canDeleteGuests: false,
    canManagePromoters: false,
    canEditEvent: false,
    canDeleteEvent: false,
    promoterData: null,
  };
}

// Helper para verificar se promoter pode adicionar mais convidados
export function canPromoterAddMoreGuests(promoter: Promoter): boolean {
  if (!promoter.guestQuota) return true; // Sem limite
  return promoter.guestsAdded < promoter.guestQuota;
}

// Helper para filtrar convidados baseado em permissões
export function getFilteredGuests(
  event: Event,
  currentUser: User | null,
  permissions: ReturnType<typeof usePermissions>
) {
  if (!currentUser) return [];

  // Owner e promoters com permissão veem todos
  if (permissions.canViewAllGuests) {
    return event.guests;
  }

  // Promoter vê apenas seus convidados
  if (permissions.isPromoter && permissions.promoterData) {
    return event.guests.filter((g) => g.addedBy === permissions.promoterData!.id);
  }

  // Guest não vê lista
  return [];
}

// Helper para obter estatísticas do promoter
export function getPromoterStats(promoter: Promoter, event: Event) {
  const myGuests = event.guests.filter((g) => g.addedBy === promoter.id);
  const confirmed = myGuests.filter((g) => g.confirmed).length;
  const checkedIn = myGuests.filter((g) => g.checkedIn).length;
  const remaining = promoter.guestQuota ? promoter.guestQuota - promoter.guestsAdded : null;

  return {
    total: myGuests.length,
    confirmed,
    checkedIn,
    remaining,
    hasQuota: !!promoter.guestQuota,
  };
}
