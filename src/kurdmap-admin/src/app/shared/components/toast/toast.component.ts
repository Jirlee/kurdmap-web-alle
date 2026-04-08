import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService, type ToastMessage } from '../../../core/services/notification.service';

const TOAST_STYLES: Record<string, string> = {
  success: 'bg-success-50/95 border-success-200 text-success-800 dark:bg-success-900/90 dark:border-success-800 dark:text-success-200',
  error: 'bg-danger-50/95 border-danger-200 text-danger-800 dark:bg-danger-900/90 dark:border-danger-800 dark:text-danger-200',
  warning: 'bg-warning-50/95 border-warning-200 text-warning-800 dark:bg-warning-900/90 dark:border-warning-800 dark:text-warning-200',
  info: 'bg-primary-50/95 border-primary-200 text-primary-800 dark:bg-primary-900/90 dark:border-primary-800 dark:text-primary-200',
};

const TOAST_ICONS: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

@Component({
  selector: 'admin-toast',
  template: `
    <div class="fixed top-4 start-4 z-[100] flex flex-col gap-2" style="min-width: 360px;" role="status" aria-live="polite">
      @for (msg of notifications.messages(); track msg.id) {
        <div class="flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-lg backdrop-blur-sm transition-all animate-slide-in"
             [class]="getToastClass(msg)">
          <span class="material-icons text-lg" aria-hidden="true">{{ getToastIcon(msg) }}</span>
          <span class="flex-1 text-sm font-medium">{{ msg.text }}</span>
          <button
            type="button"
            (click)="notifications.dismiss(msg.id)"
            aria-label="داخستن"
            class="material-icons text-base opacity-60 hover:opacity-100 cursor-pointer"
          >close</button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly notifications = inject(NotificationService);

  protected getToastClass(msg: ToastMessage): string {
    return TOAST_STYLES[msg.type] ?? 'bg-surface border-border text-text';
  }

  protected getToastIcon(msg: ToastMessage): string {
    return TOAST_ICONS[msg.type] ?? 'info';
  }
}
