import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserApiService } from '../../core/services/user-api.service';
import type { SavedApartmentItem } from '../../core/interfaces/user.types';
import type { ApartmentListItem } from '../../core/interfaces/user.types';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-saved-apartments-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './saved-apartments.page.html',
  styleUrl: './saved-apartments.page.scss',
})
export class SavedApartmentsPage implements OnInit {
  private readonly userApi = inject(UserApiService);
  private readonly translate = inject(TranslateService);

  items = signal<SavedApartmentItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);
  removingId = signal<number | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.error.set(null);
    this.loading.set(true);
    this.userApi.getSavedApartments(page, PAGE_SIZE).subscribe({
      next: (res) => {
        this.items.set(res.results ?? []);
        this.totalCount.set(res.count ?? res.results?.length ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('saved.errLoad'));
      },
    });
  }

  remove(item: SavedApartmentItem): void {
    this.removingId.set(item.id);
    this.userApi.removeSavedApartment(item.id).subscribe({
      next: () => {
        this.items.update((list) => list.filter((x) => x.id !== item.id));
        this.totalCount.update((c) => Math.max(0, c - 1));
        this.removingId.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('saved.errRemove'));
        this.removingId.set(null);
      },
    });
  }

  nextPage(): void {
    if (this.hasNext()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.loadPage(this.currentPage() - 1);
  }

  formatMoney(value: string | number | undefined): string {
    if (value == null) return this.translate.instant('mortgage.dash');
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) return String(value);
    const locale =
      this.translate.currentLang === 'en' ? 'en-US' : this.translate.currentLang === 'kk' ? 'kk-KZ' : 'ru-RU';
    return (
      new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num) +
      ' ' +
      this.translate.instant('mortgage.currency')
    );
  }

  firstImage(apt: ApartmentListItem): string | null {
    const imgs = apt?.images;
    if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') return imgs[0];
    return null;
  }
}
