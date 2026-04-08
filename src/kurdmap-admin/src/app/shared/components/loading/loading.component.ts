import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'admin-loading',
  template: `
    <div class="flex flex-col items-center justify-center py-16 gap-3" role="status" aria-label="بارکردن...">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" aria-hidden="true"></div>
      <span class="text-sm text-text-secondary">بارکردن...</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {}
