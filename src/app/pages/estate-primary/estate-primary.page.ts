import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import type { Apartment } from '../../core/interfaces/apartment.types';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-estate-primary-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './estate-primary.page.html',
  styleUrl: './estate-primary.page.scss',
})
export class EstatePrimaryPage implements OnInit {
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);

  apartments = signal<Apartment[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPage(1);
    }
  }

  loadPage(page: number): void {
    this.error.set(null);
    this.loading.set(true);
    this.mortgageApi
      .getApartments({ housing_type: 'primary', page, page_size: PAGE_SIZE })
      .subscribe({
        next: (res) => {
          this.apartments.set(res.results ?? []);
          this.totalCount.set(res.count ?? res.results?.length ?? 0);
          this.currentPage.set(page);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки');
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
    if (value == null) return '—';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) return String(value);
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + ' ₸';
  }

  firstImage(apartment: Apartment): string | null {
    const imgs = apartment['images'];
    if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') return imgs[0];
    return null;
  }
}
