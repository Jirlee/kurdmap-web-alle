import {
  ChangeDetectionStrategy,
  Component,
  inject,
  effect,
  signal,
  PLATFORM_ID,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../../core/services/modal.service';
import SearchComponent from '../../../features/search/search.component';
import BusinessDetailComponent from '../../../features/business-detail/business-detail.component';
import { PolicyComponent } from '../../../features/policy/policy.component';

@Component({
  selector: 'app-modal-overlay',
  imports: [SearchComponent, BusinessDetailComponent, PolicyComponent, TranslateModule],
  template: `
    @if (modalService.isOpen()) {
      <!-- Backdrop with blur + dim -->
      <div
        class="modal-backdrop"
        [style.z-index]="99 + modalService.depth()"
        (click)="onBackdropClick($event)"
        role="presentation"
      >
        <!-- Modal sheet (bottom-sheet on mobile, centered panel on desktop) -->
        <div
          #modalPanel
          class="modal-sheet"
          [class.is-dragging]="isDragging()"
          [style.transform]="dragY() > 0 ? 'translateY(' + dragY() + 'px)' : null"
          [style.z-index]="100 + modalService.depth()"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="modalService.activeModal()?.type === 'search' ? ('nav.search' | translate) : ('business.detail' | translate)"
          (click)="$event.stopPropagation()"
        >
          <!-- Drag handle (mobile) — draggable to dismiss -->
          <div
            class="modal-drag-handle"
            (pointerdown)="onDragStart($event)"
            role="button"
            tabindex="-1"
            aria-hidden="true"
          >
            <div class="mx-auto w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>

          <!-- Top bar -->
          <div class="modal-topbar">
            <!-- Back button (nested modals) -->
            @if (modalService.canGoBack()) {
              <button
                (click)="modalService.back()"
                class="modal-btn-back"
                [attr.aria-label]="'common.back' | translate"
              >
                <svg class="size-5 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            }

            <!-- Title -->
            <h2 class="modal-title">
              @if (modalService.activeModal()?.type === 'search') {
                {{ 'nav.search' | translate }}
              } @else if (modalService.activeModal()?.type === 'policy') {
                {{ 'policy.title' | translate }}
              } @else {
                {{ 'business.detail' | translate }}
              }
            </h2>

            <!-- Close button -->
            <button
              (click)="modalService.close()"
              class="modal-btn-close"
              [attr.aria-label]="'aria.close' | translate"
            >
              <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Scrollable content area -->
          <div class="modal-content" #modalContent>
            @switch (modalService.activeModal()?.type) {
              @case ('search') {
                <app-search [modalParams]="$any(modalService.activeModal()).params" />
              }
              @case ('business-detail') {
                <app-business-detail [modalSlug]="$any(modalService.activeModal()).slug" />
              }
              @case ('policy') {
                <app-policy />
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* --- Backdrop --- */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px) saturate(120%);
      -webkit-backdrop-filter: blur(8px) saturate(120%);
      animation: modal-fade-in 0.25s ease-out;
    }

    /* --- Modal Sheet --- */
    .modal-sheet {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      background: var(--color-surface, #fff);
      animation: modal-slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1);
      will-change: transform;
      overflow: hidden;
    }
    /* Smooth snap-back when the drag is released */
    .modal-sheet:not(.is-dragging) {
      transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .modal-sheet.is-dragging {
      transition: none;
      animation: none;
      user-select: none;
    }

    /* Mobile: bottom-sheet with rounded top */
    @media (max-width: 639px) {
      .modal-sheet {
        top: 2rem;
        border-radius: 1.25rem 1.25rem 0 0;
        box-shadow:
          0 -4px 32px rgba(0, 0, 0, 0.12),
          0 -1px 8px rgba(0, 0, 0, 0.06);
      }
    }

    /* Tablet+ : inset panel with rounded corners */
    @media (min-width: 640px) {
      .modal-sheet {
        top: 1.5rem;
        bottom: 0;
        left: 2rem;
        right: 2rem;
        border-radius: 1.25rem 1.25rem 0 0;
        box-shadow:
          0 -8px 48px rgba(0, 0, 0, 0.15),
          0 -2px 12px rgba(0, 0, 0, 0.08);
      }
    }

    /* Desktop: narrower with side margins */
    @media (min-width: 1024px) {
      .modal-sheet {
        top: 2rem;
        left: 4rem;
        right: 4rem;
        max-width: 72rem;
        margin-inline: auto;
      }
    }

    /* --- Drag handle (mobile only) --- */
    .modal-drag-handle {
      padding: 0.5rem 0 0.25rem;
      display: flex;
      justify-content: center;
      cursor: grab;
      touch-action: none;
    }
    .modal-drag-handle:active {
      cursor: grabbing;
    }
    @media (min-width: 640px) {
      .modal-drag-handle { display: none; }
    }

    /* --- Top bar --- */
    .modal-topbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      flex-shrink: 0;
      min-height: 3rem;
      background: inherit;

      /* Slight glass effect */
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    @media (min-width: 640px) {
      .modal-topbar {
        padding: 1rem 1.5rem;
      }
    }

    .modal-title {
      flex: 1;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-gray-900, #111);
      margin: 0;
      text-align: center;
    }
    @media (min-width: 640px) {
      .modal-title {
        text-align: start;
        font-size: 1.125rem;
      }
    }

    /* --- Buttons --- */
    .modal-btn-back,
    .modal-btn-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.75rem;
      border: none;
      background: transparent;
      color: var(--color-gray-500, #6b7280);
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .modal-btn-back:hover,
    .modal-btn-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--color-gray-700, #374151);
    }
    .modal-btn-back:active,
    .modal-btn-close:active {
      transform: scale(0.92);
    }
    .modal-btn-back:focus-visible,
    .modal-btn-close:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    /* --- Content area --- */
    .modal-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }

    /* --- Keyframes --- */
    @keyframes modal-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modal-slide-up {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      60% {
        opacity: 1;
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* --- Dark mode --- */
    :host-context(.dark) .modal-sheet {
      background: var(--color-surface, #0f172a);
    }
    :host-context(.dark) .modal-topbar {
      border-bottom-color: rgba(255, 255, 255, 0.06);
    }
    :host-context(.dark) .modal-title {
      color: var(--color-gray-100, #f1f5f9);
    }
    :host-context(.dark) .modal-btn-back:hover,
    :host-context(.dark) .modal-btn-close:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-gray-200, #e2e8f0);
    }

    /* --- Reduce motion --- */
    @media (prefers-reduced-motion: reduce) {
      .modal-backdrop,
      .modal-sheet {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalOverlayComponent {
  protected readonly modalService = inject(ModalService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modalPanel = viewChild<ElementRef>('modalPanel');
  private readonly modalContent = viewChild<ElementRef>('modalContent');

  /** Live vertical drag offset of the bottom sheet (px, downward only). */
  protected readonly dragY = signal(0);
  protected readonly isDragging = signal(false);
  private dragStartY = 0;
  private dragStartTime = 0;
  /** Dismiss threshold: drag past this distance (or flick fast) to close. */
  private static readonly DISMISS_DISTANCE = 120;
  private static readonly DISMISS_VELOCITY = 0.6; // px per ms

  protected onDragStart(event: PointerEvent): void {
    // Only drag the bottom sheet on touch/small screens.
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(min-width: 640px)').matches) return;

    this.isDragging.set(true);
    this.dragStartY = event.clientY;
    this.dragStartTime = performance.now();

    const onMove = (e: PointerEvent) => {
      const delta = e.clientY - this.dragStartY;
      // Downward only; add light resistance when dragging up.
      this.dragY.set(delta > 0 ? delta : delta * 0.2);
    };

    const onEnd = (e: PointerEvent) => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);

      const delta = e.clientY - this.dragStartY;
      const elapsed = performance.now() - this.dragStartTime;
      const velocity = delta / Math.max(elapsed, 1);

      this.isDragging.set(false);

      if (delta > ModalOverlayComponent.DISMISS_DISTANCE ||
          velocity > ModalOverlayComponent.DISMISS_VELOCITY) {
        // Animate out then close.
        this.dragY.set(window.innerHeight);
        setTimeout(() => {
          this.dragY.set(0);
          if (this.modalService.canGoBack()) {
            this.modalService.back();
          } else {
            this.modalService.close();
          }
        }, 220);
      } else {
        // Snap back to resting position.
        this.dragY.set(0);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
  }

  constructor() {
    // Lock body scroll when modal is open
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (this.modalService.isOpen()) {
        document.body.style.overflow = 'hidden';
        this.dragY.set(0);
        this.isDragging.set(false);
        // Scroll modal content to top when switching
        requestAnimationFrame(() => {
          const content = this.modalContent()?.nativeElement;
          if (content) content.scrollTop = 0;
        });
      } else {
        document.body.style.overflow = '';
      }
    });

    // Keyboard: Escape to close/back, focus trapping
    if (isPlatformBrowser(this.platformId)) {
      const keyHandler = (e: KeyboardEvent) => {
        if (!this.modalService.isOpen()) return;

        if (e.key === 'Escape') {
          e.preventDefault();
          if (this.modalService.canGoBack()) {
            this.modalService.back();
          } else {
            this.modalService.close();
          }
        }

        // Focus trap: Tab cycling
        if (e.key === 'Tab') {
          const panel = this.modalPanel()?.nativeElement;
          if (!panel) return;
          const focusable = panel.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>;
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', keyHandler);
      this.destroyRef.onDestroy(() => document.removeEventListener('keydown', keyHandler));
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.modalService.close();
    }
  }
}
