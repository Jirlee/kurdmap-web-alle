import { ChangeDetectionStrategy, Component, input, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OpeningHours, DaySchedule } from '../../../core/models';

interface DayRow {
  key: string;
  translationKey: string;
  schedule: DaySchedule | null;
  isToday: boolean;
}

@Component({
  selector: 'app-opening-hours',
  imports: [NgClass, TranslateModule],
  template: `
    <div class="divide-y divide-gray-100">
      @for (day of days(); track day.key) {
        <div
          class="flex items-center justify-between py-2.5 px-3 text-sm first:pt-0 last:pb-0"
          [ngClass]="day.isToday ? 'bg-primary-50 -mx-3 px-3 rounded-lg font-semibold' : ''"
        >
          <span class="flex items-center gap-2">
            {{ 'business.days.' + day.key | translate }}
            @if (day.isToday) {
              <span class="text-xs text-primary-600 font-medium">({{ 'business.today' | translate }})</span>
            }
          </span>
          <span [ngClass]="day.schedule?.closed ? 'text-red-500' : 'text-gray-700'">
            @if (!day.schedule || day.schedule.closed) {
              {{ 'business.closed' | translate }}
            } @else {
              {{ day.schedule.open }} – {{ day.schedule.close }}
            }
          </span>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpeningHoursComponent {
  readonly hours = input<OpeningHours | null>(null);

  private readonly dayKeys: { key: keyof OpeningHours; jsDay: number }[] = [
    { key: 'monday', jsDay: 1 },
    { key: 'tuesday', jsDay: 2 },
    { key: 'wednesday', jsDay: 3 },
    { key: 'thursday', jsDay: 4 },
    { key: 'friday', jsDay: 5 },
    { key: 'saturday', jsDay: 6 },
    { key: 'sunday', jsDay: 0 },
  ];

  readonly days = computed<DayRow[]>(() => {
    const h = this.hours();
    const today = new Date().getDay();

    return this.dayKeys.map(d => ({
      key: d.key,
      translationKey: `business.days.${d.key}`,
      schedule: h ? h[d.key] : null,
      isToday: today === d.jsDay,
    }));
  });
}
