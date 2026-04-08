import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/services';
import { ToastComponent } from '../../shared/components';

@Component({
  selector: 'admin-login-layout',
  imports: [RouterOutlet, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-toast />
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10" aria-hidden="true">
        <div class="absolute -top-1/2 -start-1/2 h-[200%] w-[200%]
                    bg-[radial-gradient(circle_at_center,_var(--color-primary-400)_1px,_transparent_1px)]
                    bg-[size:40px_40px]"></div>
      </div>
      <div class="absolute top-6 end-6">
        <button
          type="button"
          (click)="theme.toggle()"
          class="flex items-center justify-center rounded-full bg-white/10 p-2.5 text-white/80
                 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
          [attr.aria-label]="theme.isDarkMode() ? 'تێمی ڕووناک' : 'تێمی تاریک'"
        >
          <span class="material-icons text-xl" aria-hidden="true">{{ theme.isDarkMode() ? 'light_mode' : 'dark_mode' }}</span>
        </button>
      </div>
      <div class="relative z-10 w-full px-4">
        <router-outlet />
      </div>
    </main>
  `,
})
export class LoginLayoutComponent {
  protected readonly theme = inject(ThemeService);
}
