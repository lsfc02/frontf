import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formata um número para o padrão brasileiro (pt-BR).
 * @param value o número a ser formatado.
 * @param options opções de formatação do Intl.NumberFormat.
 * @returns o número formatado como string.
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  if (options.style === 'currency' && !options.currency) {
    options.currency = 'BRL';
  }

  return new Intl.NumberFormat('pt-BR', options).format(value);
}