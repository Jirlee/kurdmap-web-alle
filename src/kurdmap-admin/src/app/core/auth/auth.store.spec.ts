import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthStore } from './auth.store';
import type { AuthResponse } from '../models';

describe('AuthStore', () => {
  let store: AuthStore;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    userId: 'user-123',
    email: 'admin@kurdmap.de',
    fullName: 'Test Admin',
    roles: ['SuperAdmin'],
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    store = TestBed.inject(AuthStore);
    TestBed.flushEffects();
  });

  it('should start unauthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.fullName()).toBe('');
    expect(store.email()).toBe('');
    expect(store.roles()).toEqual([]);
    expect(store.accessToken()).toBeNull();
  });

  it('should set auth from response', () => {
    store.setAuth(mockAuthResponse);

    expect(store.isAuthenticated()).toBe(true);
    expect(store.fullName()).toBe('Test Admin');
    expect(store.email()).toBe('admin@kurdmap.de');
    expect(store.roles()).toEqual(['SuperAdmin']);
    expect(store.userId()).toBe('user-123');
    expect(store.accessToken()).toBe('test-access-token');
    expect(store.refreshToken()).toBe('test-refresh-token');
  });

  it('should detect SuperAdmin role', () => {
    store.setAuth(mockAuthResponse);
    expect(store.isSuperAdmin()).toBe(true);
    expect(store.isAdmin()).toBe(true);
    expect(store.hasAdminAccess()).toBe(true);
  });

  it('should detect Admin role', () => {
    store.setAuth({ ...mockAuthResponse, roles: ['Admin'] });
    expect(store.isSuperAdmin()).toBe(false);
    expect(store.isAdmin()).toBe(true);
    expect(store.hasAdminAccess()).toBe(true);
  });

  it('should detect Moderator has admin access', () => {
    store.setAuth({ ...mockAuthResponse, roles: ['Moderator'] });
    expect(store.isSuperAdmin()).toBe(false);
    expect(store.isAdmin()).toBe(false);
    expect(store.hasAdminAccess()).toBe(true);
  });

  it('should deny admin access for regular User', () => {
    store.setAuth({ ...mockAuthResponse, roles: ['User'] });
    expect(store.hasAdminAccess()).toBe(false);
  });

  it('should update tokens', () => {
    store.setAuth(mockAuthResponse);
    store.updateTokens('new-access', 'new-refresh');

    expect(store.accessToken()).toBe('new-access');
    expect(store.refreshToken()).toBe('new-refresh');
    expect(store.fullName()).toBe('Test Admin');
  });

  it('should clear auth state', () => {
    store.setAuth(mockAuthResponse);
    store.clear();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.fullName()).toBe('');
  });

  it('should persist to sessionStorage', () => {
    store.setAuth(mockAuthResponse);
    TestBed.flushEffects();
    const stored = sessionStorage.getItem('kurdmap_auth');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('user-123');
    expect(parsed.email).toBe('admin@kurdmap.de');
  });

  it('should restore from sessionStorage', () => {
    // Reset TestBed to force fresh provider creation
    TestBed.resetTestingModule();
    sessionStorage.setItem('kurdmap_auth', JSON.stringify({
      accessToken: 'stored-token',
      refreshToken: 'stored-refresh',
      userId: 'stored-user',
      email: 'stored@kurdmap.de',
      fullName: 'Stored User',
      roles: ['Admin'],
    }));

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const freshStore = TestBed.inject(AuthStore);
    expect(freshStore.isAuthenticated()).toBe(true);
    expect(freshStore.email()).toBe('stored@kurdmap.de');
  });
});
