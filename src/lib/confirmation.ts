// Utilitários para geração de tokens e links de confirmação

import { Guest, Event } from "./types";

/**
 * Gera um token único para confirmação do convidado
 */
export function generateConfirmationToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Gera um código de confirmação legível (ex: CONF-ABC123)
 */
export function generateConfirmationCode(): string {
  return `CONF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

/**
 * Gera o link de confirmação completo para um convidado
 */
export function generateConfirmationLink(
  eventId: string,
  guestId: string,
  token: string
): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/confirm/${token}`;
}

/**
 * Busca convidado e evento pelo token de confirmação
 */
export function findGuestByToken(
  events: Event[],
  token: string
): { guest: Guest; event: Event } | null {
  for (const event of events) {
    const guest = event.guests.find((g) => g.confirmationToken === token);
    if (guest) {
      return { guest, event };
    }
  }
  return null;
}

/**
 * Busca convidado e evento pelo código de confirmação
 */
export function findGuestByCode(
  events: Event[],
  code: string
): { guest: Guest; event: Event } | null {
  for (const event of events) {
    const guest = event.guests.find((g) => g.confirmationCode === code);
    if (guest) {
      return { guest, event };
    }
  }
  return null;
}

/**
 * Copia texto para área de transferência
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error("Erro ao copiar:", error);
    return false;
  }
}
