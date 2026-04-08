import { Injectable, signal, DestroyRef, inject } from '@angular/core';

export interface ToastMessage {
  readonly id: number;
  readonly text: string;
  readonly type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  readonly messages = signal<readonly ToastMessage[]>([]);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.timers.forEach(timer => clearTimeout(timer));
      this.timers.clear();
    });
  }

  success(text: string): void { this.add(text, 'success'); }
  error(text: string): void { this.add(text, 'error'); }
  warning(text: string): void { this.add(text, 'warning'); }
  info(text: string): void { this.add(text, 'info'); }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.messages.update(msgs => msgs.filter(m => m.id !== id));
  }

  private add(text: string, type: ToastMessage['type']): void {
    const id = ++this.nextId;
    this.messages.update(msgs => [...msgs, { id, text, type }]);
    const timer = setTimeout(() => {
      this.timers.delete(id);
      this.messages.update(msgs => msgs.filter(m => m.id !== id));
    }, 5000);
    this.timers.set(id, timer);
  }
}
