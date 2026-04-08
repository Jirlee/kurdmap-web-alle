import { getLocalized, getStatusLabel, getStatusColor, getRoleLabel, getRoleColor } from './display-helpers';
import { BusinessStatus, MultilingualText } from '../models';

describe('Display Helpers', () => {
  const sampleText: MultilingualText = {
    ku: 'کوردی سۆرانی',
    kmr: 'Kurdî Kurmancî',
    de: 'Deutsch',
    en: 'English',
  };

  describe('getLocalized', () => {
    it('should return German by default', () => {
      expect(getLocalized(sampleText)).toBe('Deutsch');
    });

    it('should return Kurdish Sorani for ku', () => {
      expect(getLocalized(sampleText, 'ku')).toBe('کوردی سۆرانی');
    });

    it('should return Kurmanji for kmr', () => {
      expect(getLocalized(sampleText, 'kmr')).toBe('Kurdî Kurmancî');
    });

    it('should return English for en', () => {
      expect(getLocalized(sampleText, 'en')).toBe('English');
    });

    it('should fall back to ku when kmr is null', () => {
      const text: MultilingualText = { ku: 'فلبک', de: 'Fallback' };
      expect(getLocalized(text, 'kmr')).toBe('فلبک');
    });

    it('should fall back to de when en is null', () => {
      const text: MultilingualText = { ku: 'test', de: 'Fallback DE' };
      expect(getLocalized(text, 'en')).toBe('Fallback DE');
    });
  });

  describe('getStatusLabel', () => {
    it('should return label for Pending', () => {
      expect(getStatusLabel(BusinessStatus.Pending)).toBe('چاوەڕوانی');
    });

    it('should return label for Active', () => {
      expect(getStatusLabel(BusinessStatus.Active)).toBe('چالاک');
    });

    it('should return label for Rejected', () => {
      expect(getStatusLabel(BusinessStatus.Rejected)).toBe('ڕەتکراوە');
    });

    it('should return label for Deactivated', () => {
      expect(getStatusLabel(BusinessStatus.Deactivated)).toBe('ناچالاک');
    });

    it('should return unknown for invalid status', () => {
      expect(getStatusLabel(99)).toBe('نادیار');
    });
  });

  describe('getStatusColor', () => {
    it('should return warning color for Pending', () => {
      expect(getStatusColor(BusinessStatus.Pending)).toContain('warning');
    });

    it('should return success color for Active', () => {
      expect(getStatusColor(BusinessStatus.Active)).toContain('success');
    });

    it('should return danger color for Rejected', () => {
      expect(getStatusColor(BusinessStatus.Rejected)).toContain('danger');
    });
  });

  describe('getRoleLabel', () => {
    it('should return Kurdish label for SuperAdmin', () => {
      expect(getRoleLabel('SuperAdmin')).toBe('بەڕێوەبەری باڵا');
    });

    it('should return Kurdish label for Admin', () => {
      expect(getRoleLabel('Admin')).toBe('بەڕێوەبەر');
    });

    it('should return Kurdish label for Moderator', () => {
      expect(getRoleLabel('Moderator')).toBe('چاودێر');
    });

    it('should return Kurdish label for BusinessOwner', () => {
      expect(getRoleLabel('BusinessOwner')).toBe('خاوەنی بازرگانی');
    });

    it('should return Kurdish label for User', () => {
      expect(getRoleLabel('User')).toBe('بەکارهێنەر');
    });

    it('should return raw role for unknown role', () => {
      expect(getRoleLabel('CustomRole')).toBe('CustomRole');
    });
  });

  describe('getRoleColor', () => {
    it('should return danger color for SuperAdmin', () => {
      expect(getRoleColor('SuperAdmin')).toContain('danger');
    });

    it('should return warning color for Admin', () => {
      expect(getRoleColor('Admin')).toContain('warning');
    });

    it('should return primary color for Moderator', () => {
      expect(getRoleColor('Moderator')).toContain('primary');
    });
  });
});
