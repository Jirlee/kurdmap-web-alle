import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1">
      @for (star of stars; track star) {
        <span
          class="text-base leading-none"
          [class]="star <= rating() ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'"
        >★</span>
      }
      @if (showValue()) {
        <span class="ms-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">{{ rating() }}/5</span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  readonly rating = input.required<number>();
  readonly showValue = input(false);

  protected readonly stars = [1, 2, 3, 4, 5];
}
