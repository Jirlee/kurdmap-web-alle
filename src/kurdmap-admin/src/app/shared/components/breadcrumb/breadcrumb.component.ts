import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

interface Crumb {
  label: string;
  route: string | null;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'داشبۆڕد',
  businesses: 'بازرگانییەکان',
  categories: 'پۆلەکان',
  cities: 'شارەکان',
  advertisements: 'ڕیکلام',
  reviews: 'هەڵسەنگاندن',
  reports: 'ڕاپۆرتەکان',
  users: 'بەکارهێنەران',
  settings: 'ڕێکخستنەکان',
  roadmap: 'نەخشەی ڕێگا',
};

@Component({
  selector: 'admin-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav aria-label="بریدکرامب" class="mb-4">
      <ol class="flex items-center gap-1.5 text-sm text-text-secondary">
        @for (crumb of crumbs(); track crumb.label; let last = $last) {
          <li class="flex items-center gap-1.5">
            @if (crumb.route !== null && !last) {
              <a [routerLink]="crumb.route" class="hover:text-primary-600 transition-colors">{{ crumb.label }}</a>
              <span class="material-icons text-xs opacity-40" aria-hidden="true">chevron_left</span>
            } @else {
              <span class="font-medium text-text">{{ crumb.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);

  protected readonly crumbs = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
      map(url => this.buildCrumbs(url)),
    ),
    { initialValue: [] as Crumb[] },
  );

  private buildCrumbs(url: string): Crumb[] {
    const segments = url.split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'داشبۆڕد', route: '/' }];

    let path = '';
    for (const seg of segments) {
      path += '/' + seg;
      const label = ROUTE_LABELS[seg];
      if (label) {
        crumbs.push({ label, route: path });
      }
    }

    return crumbs;
  }
}
