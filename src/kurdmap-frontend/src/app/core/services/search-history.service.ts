import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'kurdmap.searchHistory';
const MAX_ENTRIES = 8;

/**
 * Persists the user's recent search queries in localStorage so the search
 * modal can offer predictive "recent searches" suggestions.
 */
@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Reactive list of recent queries, most recent first. */
  readonly recent = signal<string[]>(this.load());

  add(query: string): void {
    const q = query.trim();
    if (!q || q.length < 2 || !this.isBrowser) return;

    const lower = q.toLowerCase();
    // Drop duplicates and shorter prefixes of the new query (incremental typing).
    const filtered = this.recent().filter(item => {
      const il = item.toLowerCase();
      return il !== lower && !lower.startsWith(il);
    });
    const next = [q, ...filtered].slice(0, MAX_ENTRIES);
    this.recent.set(next);
    this.persist(next);
  }

  remove(query: string): void {
    const next = this.recent().filter(item => item !== query);
    this.recent.set(next);
    this.persist(next);
  }

  clear(): void {
    this.recent.set([]);
    this.persist([]);
  }

  private load(): string[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string').slice(0, MAX_ENTRIES) : [];
    } catch {
      return [];
    }
  }

  private persist(list: string[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }
}
