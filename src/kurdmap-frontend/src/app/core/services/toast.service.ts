import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  icon?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', duration = 4000, icon?: string): void {
    const id = ++this.nextId;
    this.toasts.update(t => [...t, { id, message, type, duration, icon }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration = 3500): void {
    this.show(message, 'success', duration, 'check_circle');
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration, 'info');
  }

  warning(message: string, duration = 5000): void {
    this.show(message, 'warning', duration, 'warning');
  }

  error(message: string, duration = 6000): void {
    this.show(message, 'error', duration, 'error');
  }

  dismiss(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
