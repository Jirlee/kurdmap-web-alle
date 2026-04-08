import { Injectable, signal, computed } from '@angular/core';

export interface SearchModalParams {
  q?: string;
  category?: string;
  city?: string;
  nearMe?: boolean;
}

export type ModalView =
  | { type: 'search'; params?: SearchModalParams }
  | { type: 'business-detail'; slug: string }
  | { type: 'policy' };

@Injectable({ providedIn: 'root' })
export class ModalService {
  /** Stack of modal views — supports nested modals */
  private readonly stack = signal<ModalView[]>([]);

  /** Current top-most modal */
  readonly activeModal = computed<ModalView | null>(() => {
    const s = this.stack();
    return s.length > 0 ? s[s.length - 1] : null;
  });

  /** Whether any modal is open */
  readonly isOpen = computed(() => this.stack().length > 0);

  /** Depth of modal stack (for z-index layering) */
  readonly depth = computed(() => this.stack().length);

  /** Whether the back button should be shown (nested) */
  readonly canGoBack = computed(() => this.stack().length > 1);

  openSearch(params?: SearchModalParams): void {
    this.stack.update(s => [...s, { type: 'search', params }]);
  }

  openBusinessDetail(slug: string): void {
    this.stack.update(s => [...s, { type: 'business-detail', slug }]);
  }

  openPolicy(): void {
    this.stack.update(s => [...s, { type: 'policy' }]);
  }

  /** Go back one level in the modal stack */
  back(): void {
    this.stack.update(s => s.length > 1 ? s.slice(0, -1) : []);
  }

  /** Close all modals */
  close(): void {
    this.stack.set([]);
  }
}
