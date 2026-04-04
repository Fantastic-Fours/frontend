import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DropdownSelectComponent, WheelPaginationComponent } from '../../components/ui';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import type { Apartment } from '../../core/interfaces/apartment.types';
import { KZ_BIG_CITIES } from '../../core/constants/kz-cities.constants';
import { displayThousandFromNumber, processThousandSepInput } from '../../shared/thousand-separator';

const PAGE_SIZE = 12;

type EstateListFilters = {
  city: string;
  min_price: number | undefined;
  max_price: number | undefined;
  rooms: number | undefined;
  min_rooms: number | undefined;
  property_type: string | undefined;
  min_area: number | undefined;
  max_area: number | undefined;
  floor: number | undefined;
  total_floors: number | undefined;
};

@Component({
  selector: 'app-estate-primary-page',
  standalone: true,
  imports: [RouterLink, FormsModule, WheelPaginationComponent, DropdownSelectComponent],
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

  cities = KZ_BIG_CITIES;

  readonly cityDropdownOptions = KZ_BIG_CITIES.map((c) => ({ label: c, value: c }));

  readonly propertyTypeDropdownOptions: { label: string; value: string }[] = [
    { value: '', label: 'Любой' },
    { value: 'apartment', label: 'Квартира' },
    { value: 'house', label: 'Дом' },
  ];

  readonly roomDropdownOptions: { label: string; value: string }[] = [
    { value: '', label: 'Любое' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4+' },
  ];

  filters = signal<EstateListFilters>({
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

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));

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
        housing_type: 'primary',
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
          this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки');
        },
      });
  }

  applyFilters(next: any): void {
    this.filters.set({ ...this.filters(), ...next });
    this.loadPage(1);
  }

  /** Update filter model without refetch (for thousand-sep inputs while typing). */
  patchFilters(next: Partial<EstateListFilters>): void {
    this.filters.set({ ...this.filters(), ...next });
  }

  commitFilterSearch(): void {
    this.loadPage(1);
  }

  readonly displayThousandFromNumber = displayThousandFromNumber;

  onThousandFilterInput(
    event: Event,
    key: 'min_price' | 'max_price' | 'floor' | 'total_floors',
  ): void {
    const el = event.target as HTMLInputElement;
    processThousandSepInput(el, {
      onDigits: (raw) => {
        const n = raw ? Number.parseInt(raw, 10) : NaN;
        const v = raw && Number.isFinite(n) ? n : undefined;
        this.patchFilters({ [key]: v } as Partial<EstateListFilters>);
      },
    });
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

  /** Current «Комнат» filter as string for dropdown (uses `min_rooms`). */
  roomsFilterKey(): string {
    const m = this.filters().min_rooms;
    return m != null ? String(m) : '';
  }

  onRoomsFilterChange(raw: unknown): void {
    const s = raw === '' || raw == null ? '' : String(raw);
    this.applyFilters({
      rooms: undefined,
      min_rooms: s ? this.toInt(s) : undefined,
    });
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
}
