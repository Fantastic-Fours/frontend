import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { type Apartment, PROPERTY_CONDITION_LABELS } from '../../core/interfaces/apartment.types';
import { KZ_BIG_CITIES } from '../../core/constants/kz-cities.constants';
import { TranslateService } from '@ngx-translate/core';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-estate-secondary-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './estate-secondary.page.html',
  styleUrl: './estate-secondary.page.scss',
})
export class EstateSecondaryPage implements OnInit {
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(TranslateService);

  apartments = signal<Apartment[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  cities = KZ_BIG_CITIES;
  filters = signal({
    city: 'Алматы',
    min_price: undefined as number | undefined,
    max_price: undefined as number | undefined,
    rooms: undefined as number | undefined,
    min_rooms: undefined as number | undefined,
    property_type: 'apartment' as string | undefined,
    min_area: undefined as number | undefined,
    max_area: undefined as number | undefined,
    floor: undefined as number | undefined,
    total_floors: undefined as number | undefined,
  });

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
    const f = this.filters();
    this.mortgageApi
      .getApartments({
        housing_type: 'secondary',
        page,
        page_size: PAGE_SIZE,
        city: f.city || undefined,
        min_price: f.min_price,
        max_price: f.max_price,
        rooms: f.rooms,
        min_rooms: f.min_rooms,
        property_type: f.property_type,
        min_area: f.min_area,
        max_area: f.max_area,
        floor: f.floor,
        total_floors: f.total_floors,
      })
      .subscribe({
        next: (res) => {
          this.apartments.set(res.results ?? []);
          this.totalCount.set(res.count ?? res.results?.length ?? 0);
          this.currentPage.set(page);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('estate.errLoad'));
        },
      });
  }

  nextPage(): void {
    if (this.hasNext()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.loadPage(this.currentPage() - 1);
  }

  applyFilters(next: any): void {
    this.filters.set({ ...this.filters(), ...next });
    this.loadPage(1);
  }

  clearFilters(): void {
    this.filters.set({
      city: 'Алматы',
      min_price: undefined,
      max_price: undefined,
      rooms: undefined,
      min_rooms: undefined,
      property_type: 'apartment',
      min_area: undefined,
      max_area: undefined,
      floor: undefined,
      total_floors: undefined,
    });
    this.loadPage(1);
  }

  toInt(value: unknown): number | undefined {
    const s = String(value ?? '').trim();
    if (!s) return undefined;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  toFloat(value: unknown): number | undefined {
    const s = String(value ?? '').trim();
    if (!s) return undefined;
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : undefined;
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

  /** Краткая подпись состояния для карточки списка. */
  conditionListLabel(apartment: Apartment): string | null {
    const c = apartment.condition;
    if (c == null || c === '') return null;
    return PROPERTY_CONDITION_LABELS[c as keyof typeof PROPERTY_CONDITION_LABELS] ?? null;
  }
}
