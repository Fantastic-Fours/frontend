import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  PLATFORM_ID,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { cn } from '../../../../lib/utils';

/**
 * Wheel + prev/next pager (Angular port of shadcn-style React component).
 * Public API is **1-based** page numbers to match Django/list endpoints in this app.
 */
@Component({
  selector: 'app-wheel-pagination',
  standalone: true,
  templateUrl: './wheel-pagination.component.html',
  styleUrl: './wheel-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class WheelPaginationComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Current page (1-based), from parent state */
  currentPage = input.required<number>();
  totalPages = input(1);
  visibleCount = input(5);
  /** Disable controls (e.g. while list request is in flight) */
  disabled = input(false);
  /** Optional extra classes on host (maps to React `className`) */
  hostClass = input('', { alias: 'className' });

  /** Emits 1-based page index when user changes page (wheel, arrows, or number). */
  pageSelected = output<number>();

  protected readonly container = viewChild<ElementRef<HTMLElement>>('container');

  readonly hostClasses = computed(() =>
    cn('wheel-pagination', this.hostClass()),
  );

  readonly visiblePages = computed(() => {
    const active = this.currentPage();
    const tp = Math.max(1, this.totalPages());
    const vc = Math.max(1, this.visibleCount());
    const half = Math.floor(vc / 2);
    let start = active - half;
    let end = active + half;

    if (start < 1) {
      end += 1 - start;
      start = 1;
    }
    if (end > tp) {
      start -= end - tp;
      end = tp;
      if (start < 1) start = 1;
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const el = this.container()?.nativeElement;
      if (!el) return;

      const onWheel = (e: WheelEvent) => {
        if (this.disabled()) return;
        e.preventDefault();
        const cur = this.currentPage();
        const tp = this.totalPages();
        if (e.deltaY < 0) {
          if (cur > 1) this.emitPage(cur - 1);
        } else if (e.deltaY > 0) {
          if (cur < tp) this.emitPage(cur + 1);
        }
      };

      el.addEventListener('wheel', onWheel, { passive: false });
      this.destroyRef.onDestroy(() => el.removeEventListener('wheel', onWheel));
    });
  }

  protected prevPage(): void {
    if (this.disabled()) return;
    const cur = this.currentPage();
    if (cur > 1) this.emitPage(cur - 1);
  }

  protected nextPage(): void {
    if (this.disabled()) return;
    const cur = this.currentPage();
    const tp = this.totalPages();
    if (cur < tp) this.emitPage(cur + 1);
  }

  protected selectPage(p: number): void {
    if (this.disabled()) return;
    this.emitPage(p);
  }

  private emitPage(p: number): void {
    const tp = this.totalPages();
    if (p < 1 || p > tp || p === this.currentPage()) return;
    this.pageSelected.emit(p);
  }
}
