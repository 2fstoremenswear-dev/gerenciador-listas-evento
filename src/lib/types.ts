// Types para o sistema de papéis do Nome na Lista Pro

export type UserRole = "owner" | "promoter" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: number;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  confirmed: boolean;
  checkedIn: boolean;
  listType: "Normal" | "VIP" | "Parceiros";
  timestamp: number;
  addedBy: string; // ID do promoter ou owner que adicionou
  promoterId?: string; // ID do promoter responsável (se aplicável)
  confirmationToken: string; // Token único para confirmação via link
  confirmationCode: string; // Código de confirmação legível (ex: CONF-ABC123)
  confirmedAt?: number; // Timestamp de quando confirmou
}

export interface Promoter {
  id: string;
  userId: string; // Referência ao User
  eventId: string;
  name: string;
  email: string;
  phone: string;
  permissions: PromoterPermissions;
  guestQuota?: number; // Limite de convidados que pode adicionar
  guestsAdded: number; // Contador de convidados adicionados
  createdAt: number;
  invitedBy: string; // ID do owner
}

export interface PromoterPermissions {
  canAddGuests: boolean;
  canConfirmGuests: boolean;
  canCheckInGuests: boolean;
  canViewAllGuests: boolean; // Ver todos ou apenas os seus
  canEditGuests: boolean;
  canDeleteGuests: boolean;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  maxCapacity: number;
  guests: Guest[];
  promoters: Promoter[];
  ownerId: string; // ID do dono do evento
  ownerName: string;
  createdAt: number;
  settings: EventSettings;
}

export interface EventSettings {
  allowPromoterInvites: boolean;
  requireOwnerApproval: boolean; // Convidados de promoters precisam aprovação
  maxGuestsPerPromoter?: number;
  enableCheckIn: boolean;
}

// Estado da aplicação
export interface AppState {
  currentUser: User | null;
  events: Event[];
  selectedEvent: Event | null;
}

// Permissões padrão para novos promoters
export const DEFAULT_PROMOTER_PERMISSIONS: PromoterPermissions = {
  canAddGuests: true,
  canConfirmGuests: true,
  canCheckInGuests: true,
  canViewAllGuests: false, // Por padrão, vê apenas seus convidados
  canEditGuests: false,
  canDeleteGuests: false,
};
