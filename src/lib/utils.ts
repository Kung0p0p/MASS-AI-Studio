import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ScopeOfWork } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexToRgbA(hex: string, alpha: number) {
  if (!hex || !hex.startsWith('#')) return hex;
  let c: any = hex.substring(1).split('');
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  if (c.length !== 6) return hex;
  let r = parseInt(c.slice(0, 2).join(''), 16);
  let g = parseInt(c.slice(2, 4).join(''), 16);
  let b = parseInt(c.slice(4, 6).join(''), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

export function parseThaiDateTime(dtStr: string) {
  if (!dtStr) return null;
  const parts = dtStr.trim().split(' ');
  if (parts.length === 0) return null;
  const dateParts = parts[0].split('/');
  if (dateParts.length === 3) {
    let d = parseInt(dateParts[0], 10);
    let m = parseInt(dateParts[1], 10) - 1;
    let y = parseInt(dateParts[2], 10);
    if (y > 2500) y -= 543;
    return new Date(y, m, d);
  }
  const fallback = new Date(dtStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function getScopeDuration(scopeName: string, scopeOfWorks: ScopeOfWork[]) {
  const scope = (scopeOfWorks || []).find(s => s.name === scopeName);
  if (scope) return scope.duration;
  
  // Fallback for custom/other if not found or if hardcoded strings are used
  const s = (scopeName || '').toLowerCase();
  if (s.includes('install')) return 120;
  if (s.includes('remove')) return 60;
  if (s.includes('migration')) return 180;
  if (s.includes('preventive')) return 90;
  return 60;
}
