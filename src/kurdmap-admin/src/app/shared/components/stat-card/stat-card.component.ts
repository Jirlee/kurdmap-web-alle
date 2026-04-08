import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'admin-stat-card',
  imports: [RouterLink],
  template: `
    @if (link()) {
      <a [routerLink]="link()"
         class="group relative block overflow-hidden rounded-2xl border border-border bg-surface p-6
                transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 cursor-pointer">
        <div class="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r" [class]="accentClass()" aria-hidden="true"></div>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm" [class]="iconBgClass()">
            <span class="material-icons text-2xl" [class]="iconColorClass()" aria-hidden="true">{{ icon() }}</span>
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-text">{{ value() }}</p>
            <p class="text-sm text-text-secondary">{{ label() }}</p>
          </div>
        </div>
      </a>
    } @else {
      <div class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6
                  transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5">
        <div class="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r" [class]="accentClass()" aria-hidden="true"></div>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm" [class]="iconBgClass()">
            <span class="material-icons text-2xl" [class]="iconColorClass()" aria-hidden="true">{{ icon() }}</span>
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-text">{{ value() }}</p>
            <p class="text-sm text-text-secondary">{{ label() }}</p>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly icon = input('');
  readonly value = input<number | string>(0);
  readonly label = input('');
  readonly color = input<'primary' | 'success' | 'warning' | 'danger' | 'info'>('primary');
  readonly link = input<string | null>(null);

  protected readonly iconBgClass = computed(() => {
    const map: Record<string, string> = {
      primary: 'bg-primary-100',
      success: 'bg-success-50',
      warning: 'bg-warning-50',
      danger: 'bg-danger-50',
      info: 'bg-primary-50',
    };
    return map[this.color()] ?? map['primary'];
  });

  protected readonly iconColorClass = computed(() => {
    const map: Record<string, string> = {
      primary: 'text-primary-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
      danger: 'text-danger-600',
      info: 'text-primary-500',
    };
    return map[this.color()] ?? map['primary'];
  });

  protected readonly accentClass = computed(() => {
    const map: Record<string, string> = {
      primary: 'from-primary-400 to-primary-600',
      success: 'from-success-400 to-success-600',
      warning: 'from-warning-400 to-warning-600',
      danger: 'from-danger-400 to-danger-600',
      info: 'from-primary-300 to-primary-500',
    };
    return map[this.color()] ?? map['primary'];
  });
}
