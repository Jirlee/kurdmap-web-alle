import { MultilingualText, BusinessStatus } from '../models';

export function getLocalized(text: MultilingualText, lang = 'de'): string {
  switch (lang) {
    case 'ku': return text.ku;
    case 'kmr': return text.kmr ?? text.ku;
    case 'en': return text.en ?? text.de;
    default: return text.de;
  }
}

export function getStatusLabel(status: number): string {
  switch (status) {
    case BusinessStatus.Pending: return 'چاوەڕوانی';
    case BusinessStatus.Active: return 'چالاک';
    case BusinessStatus.Rejected: return 'ڕەتکراوە';
    case BusinessStatus.Deactivated: return 'ناچالاک';
    default: return 'نادیار';
  }
}

export function getStatusColor(status: number): string {
  switch (status) {
    case BusinessStatus.Pending: return 'bg-warning-500 text-white';
    case BusinessStatus.Active: return 'bg-success-500 text-white';
    case BusinessStatus.Rejected: return 'bg-danger-500 text-white';
    case BusinessStatus.Deactivated: return 'bg-gray-500 text-white';
    default: return 'bg-gray-300 text-gray-700';
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'SuperAdmin': return 'بەڕێوەبەری باڵا';
    case 'Admin': return 'بەڕێوەبەر';
    case 'Moderator': return 'چاودێر';
    case 'BusinessOwner': return 'خاوەنی بازرگانی';
    case 'User': return 'بەکارهێنەر';
    default: return role;
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'SuperAdmin': return 'bg-danger-500 text-white';
    case 'Admin': return 'bg-warning-500 text-white';
    case 'Moderator': return 'bg-primary-500 text-white';
    case 'BusinessOwner': return 'bg-primary-300 text-white';
    case 'User': return 'bg-gray-400 text-white';
    default: return 'bg-gray-300 text-gray-700';
  }
}
