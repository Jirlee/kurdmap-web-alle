import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [TranslateModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" role="alert">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('error') {
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
              }
              @case ('warning') {
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                </svg>
              }
              @default {
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
                </svg>
              }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" [attr.aria-label]="'aria.close' | translate">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      inset-inline-end: 1.5rem;
      z-index: 300;
      display: flex;
      flex-direction: column-reverse;
      gap: 0.5rem;
      pointer-events: none;
      max-width: 24rem;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: var(--color-surface, #fff);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
      animation: toast-in 0.3s cubic-bezier(0.32, 0.72, 0, 1);
      pointer-events: auto;
      font-size: 0.875rem;
      color: var(--color-gray-700, #374151);
    }

    .toast-icon {
      flex-shrink: 0;
    }

    .toast-success .toast-icon { color: #10b981; }
    .toast-error .toast-icon { color: #ef4444; }
    .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info .toast-icon { color: #3b82f6; }

    .toast-message {
      flex: 1;
      min-width: 0;
    }

    .toast-close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 0.375rem;
      border: none;
      background: transparent;
      color: var(--color-gray-400, #9ca3af);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .toast-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--color-gray-600, #4b5563);
    }

    :host-context(.dark) .toast {
      background: var(--color-surface, #1e293b);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
      color: var(--color-gray-200, #e2e8f0);
    }
    :host-context(.dark) .toast-close:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-gray-300);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(0.5rem) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 639px) {
      .toast-container {
        bottom: 1rem;
        inset-inline-start: 1rem;
        inset-inline-end: 1rem;
        max-width: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast { animation: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
