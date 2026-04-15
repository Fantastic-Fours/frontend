import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
  computed,
  Injector,
  ElementRef,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { load } from '@2gis/mapgl';
import type { Map as Map2gis, Marker as Marker2gis } from '@2gis/mapgl/types';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import { getTwogisApiKey } from '../../core/constants/twogis.constants';
import {
  type Apartment,
  FURNISHED_LABELS,
  PARKING_LABELS,
  PROPERTY_CONDITION_LABELS,
} from '../../core/interfaces/apartment.types';
import type { PricePredictionResponse } from '../../core/interfaces/mortgage.types';

@Component({
  selector: 'app-apartment-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './apartment-detail.page.html',
  styleUrl: './apartment-detail.page.scss',
})
export class ApartmentDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly userApi = inject(UserApiService);
  private readonly authTokens = inject(AuthTokenService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  @ViewChild('mapHost') mapHost?: ElementRef<HTMLElement>;

  apartment = signal<Apartment | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  mapError = signal<string | null>(null);
  /** SavedApartment id if this apartment is in user's saved list. */
  savedId = signal<number | null>(null);
  saving = signal(false);
  ownerActionLoading = signal(false);

  isAuthenticated = computed(() => this.authTokens.hasTokens());
  slideIndex = signal(0);
  autoplay = signal(true);
  private autoplayHandle: number | null = null;
  private map: Map2gis | null = null;
  private mapMarker: Marker2gis | null = null;

  priceAnalysis = signal<PricePredictionResponse | null>(null);
  analysisLoading = signal(false);
  analysisError = signal<string | null>(null);

  analysisCardMod = computed(() => {
    const a = this.priceAnalysis();
    if (!a) return '';
    if (a.trustworthy === false || a.label === 'inconclusive') return 'deal-unknown';
    if (a.label === 'overpriced') return 'deal-over';
    if (a.label === 'good deal') return 'deal-good';
    return 'deal-fair';
  });

  analysisVerdictText = computed(() => {
    const a = this.priceAnalysis();
    if (!a) return '';
    if (a.trustworthy === false || a.label === 'inconclusive') {
      return '';
    }
    if (a.diff_percent == null) return '';
    const pct = Math.round(Math.abs(a.diff_percent * 100));
    if (a.label === 'overpriced') {
      return `Объявление завышено примерно на ${pct}% относительно рыночной оценки`;
    }
    if (a.label === 'good deal') {
      return `Выгодная сделка: цена примерно на ${pct}% ниже рыночной оценки`;
    }
    return 'Цена близка к рыночной оценке модели';
  });

  id = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  housingTypeLabel(type: string): string {
    return type === 'primary' ? 'Первичка' : type === 'secondary' ? 'Вторичка' : type;
  }

  furnishedLabel(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v);
    return FURNISHED_LABELS[s as keyof typeof FURNISHED_LABELS] ?? null;
  }

  parkingLabel(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v);
    return PARKING_LABELS[s as keyof typeof PARKING_LABELS] ?? null;
  }

  conditionLabel(v: unknown): string | null {
    if (v == null || v === '') return null;
    const s = String(v);
    return PROPERTY_CONDITION_LABELS[s as keyof typeof PROPERTY_CONDITION_LABELS] ?? null;
  }

  ngOnInit(): void {
    const id = this.id();
    if (id == null || Number.isNaN(id)) {
      this.error.set('Неверный ID объявления');
      this.loading.set(false);
      return;
    }
    this.mortgageApi.getApartment(id).subscribe({
      next: (data) => {
        this.mapError.set(null);
        this.destroyDetailMap();
        this.apartment.set(data);
        this.slideIndex.set(0);
        this.setupAutoplay();
        this.loading.set(false);
        if (this.apartmentHasMapCoords(data)) {
          afterNextRender(
            () => {
              void this.initDetailMap();
            },
            { injector: this.injector }
          );
        }
        if (this.authTokens.hasTokens()) {
          this.userApi.getSavedApartments(1, 100).subscribe({
            next: (res) => {
              const found = res.results?.find((item) => item.apartment?.id === data.id);
              if (found) this.savedId.set(found.id);
            },
          });
        }
        this.priceAnalysis.set(null);
        this.analysisError.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки');
      },
    });
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
    this.destroyDetailMap();
  }

  apartmentHasMapCoords(apt: Apartment | null): boolean {
    if (!apt) return false;
    const lat = apt.latitude;
    const lng = apt.longitude;
    if (lat == null || lng == null) return false;
    const la = typeof lat === 'number' ? lat : parseFloat(String(lat));
    const lo = typeof lng === 'number' ? lng : parseFloat(String(lng));
    return !Number.isNaN(la) && !Number.isNaN(lo);
  }

  private destroyDetailMap(): void {
    this.mapMarker?.destroy();
    this.mapMarker = null;
    this.map?.destroy();
    this.map = null;
  }

  private async initDetailMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const apt = this.apartment();
    if (!this.apartmentHasMapCoords(apt) || !apt) return;
    const el = this.mapHost?.nativeElement;
    if (!el) return;
    const apiKey = getTwogisApiKey();
    if (!apiKey) {
      this.mapError.set(
        'Карта недоступна: ключ 2GIS в frontend/.env (TWOGIS_API_KEY) или window.__TWOGIS_API_KEY__ в index.html'
      );
      return;
    }
    this.destroyDetailMap();
    const lat = typeof apt.latitude === 'number' ? apt.latitude : parseFloat(String(apt.latitude));
    const lng = typeof apt.longitude === 'number' ? apt.longitude : parseFloat(String(apt.longitude));
    const center: [number, number] = [lng, lat];
    try {
      const mapgl = await load();
      this.map = new mapgl.Map(el, {
        key: apiKey,
        center,
        zoom: 15,
      });
      this.mapMarker = new mapgl.Marker(this.map, { coordinates: center });
    } catch {
      this.mapError.set('Не удалось загрузить карту 2GIS.');
    }
  }

  addToSaved(): void {
    const apt = this.apartment();
    if (!apt?.id || this.saving()) return;
    this.saving.set(true);
    this.userApi.addSavedApartment({ apartment_id: apt.id }).subscribe({
      next: (res) => {
        this.savedId.set(res.id);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка добавления в избранное');
        this.saving.set(false);
      },
    });
  }

  removeFromSaved(): void {
    const id = this.savedId();
    if (id == null || this.saving()) return;
    this.saving.set(true);
    this.userApi.removeSavedApartment(id).subscribe({
      next: () => {
        this.savedId.set(null);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка удаления из избранного');
        this.saving.set(false);
      },
    });
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

  formatMillionFrom(value: string | number | null | undefined): string | null {
    if (value == null) return null;
    const num = typeof value === 'number' ? value : Number.parseFloat(String(value));
    if (!Number.isFinite(num) || num <= 0) return null;
    return `от ${(num / 1_000_000).toFixed(1)} млн ₸ за м²`;
  }

  roomVariants(apt: Apartment): Array<{ rooms: number; areaLabel: string; priceLabel: string }> {
    const raw = apt.complex_room_variants;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((v) => {
        const rooms = Number(v.rooms);
        if (!Number.isFinite(rooms) || rooms <= 0) return null;
        const area = this.toFinite(v.min_area_sqm);
        const minPrice = this.toFinite(v.min_price);
        return {
          rooms,
          areaLabel: area == null ? '—' : `${this.cleanNum(area)} м²`,
          priceLabel: minPrice == null ? '—' : `от ${this.formatMoney(minPrice)}`,
        };
      })
      .filter((v): v is { rooms: number; areaLabel: string; priceLabel: string } => !!v)
      .sort((a, b) => a.rooms - b.rooms);
  }

  private toFinite(v: unknown): number | null {
    const n = Number.parseFloat(String(v ?? ''));
    return Number.isFinite(n) ? n : null;
  }

  private cleanNum(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
  }

  getImages(apt: Apartment): string[] {
    const imgs = apt['images'];
    if (Array.isArray(imgs)) return imgs.filter((u): u is string => typeof u === 'string');
    return [];
  }

  currentImage(): string | null {
    const apt = this.apartment();
    if (!apt) return null;
    const imgs = this.getImages(apt);
    if (imgs.length === 0) return null;
    const idx = Math.min(Math.max(this.slideIndex(), 0), imgs.length - 1);
    return imgs[idx] ?? null;
  }

  hasCarousel(): boolean {
    const apt = this.apartment();
    if (!apt) return false;
    return this.getImages(apt).length > 1;
  }

  prevSlide(): void {
    const apt = this.apartment();
    if (!apt) return;
    const imgs = this.getImages(apt);
    if (imgs.length === 0) return;
    const next = (this.slideIndex() - 1 + imgs.length) % imgs.length;
    this.slideIndex.set(next);
  }

  nextSlide(): void {
    const apt = this.apartment();
    if (!apt) return;
    const imgs = this.getImages(apt);
    if (imgs.length === 0) return;
    const next = (this.slideIndex() + 1) % imgs.length;
    this.slideIndex.set(next);
  }

  goToSlide(i: number): void {
    const apt = this.apartment();
    if (!apt) return;
    const imgs = this.getImages(apt);
    if (i < 0 || i >= imgs.length) return;
    this.slideIndex.set(i);
  }

  private setupAutoplay(): void {
    this.clearAutoplay();
    if (!isPlatformBrowser(this.platformId)) return;
    const apt = this.apartment();
    if (!apt) return;
    if (!this.autoplay() || this.getImages(apt).length < 2) return;
    this.autoplayHandle = window.setInterval(() => this.nextSlide(), 4000);
  }

  private clearAutoplay(): void {
    if (this.autoplayHandle != null && isPlatformBrowser(this.platformId)) {
      window.clearInterval(this.autoplayHandle);
    }
    this.autoplayHandle = null;
  }

  /** Allowed programs from API (array of { id, name, bank_name, interest_rate }). */
  getProgramsList(apt: Apartment): { id: number; name: string; bank_name: string; interest_rate: number }[] {
    const list = apt['allowed_programs'];
    return Array.isArray(list) ? list : [];
  }

  getBankLogo(bankName: string): string | null {
    return getBankLogoPath(bankName);
  }

  formatDiffPercent(diff: number): string {
    const p = Math.round(diff * 100);
    if (p > 0) return `+${p}%`;
    return `${p}%`;
  }

  runPriceAnalysis(): void {
    const apartmentId = this.id();
    if (apartmentId == null || Number.isNaN(apartmentId)) return;
    this.fetchPriceAnalysis(apartmentId);
  }

  private fetchPriceAnalysis(apartmentId: number): void {
    this.analysisLoading.set(true);
    this.analysisError.set(null);
    this.priceAnalysis.set(null);
    this.mortgageApi.getPropertyPriceAnalysis(apartmentId).subscribe({
      next: (res) => {
        this.priceAnalysis.set(res);
        this.analysisLoading.set(false);
      },
      error: (err) => {
        this.analysisLoading.set(false);
        const msg = err?.error?.detail ?? err?.message;
        this.analysisError.set(
          typeof msg === 'string' ? msg : 'Оценка рынка временно недоступна'
        );
      },
    });
  }

  backLink(): string {
    const apt = this.apartment();
    if (apt?.housing_type === 'secondary') return '/estate/secondary';
    return '/estate/primary';
  }

  isOwner(apt: Apartment | null): boolean {
    return Boolean(apt && apt.is_owner === true);
  }

  authorName(apt: Apartment): string {
    const n = apt.author_display_name;
    if (n && String(n).trim()) return String(n).trim();
    const u = apt['created_by_username'];
    return u ? String(u) : 'Автор не указан';
  }

  authorPhoneTel(apt: Apartment): string {
    const p = apt.author_phone;
    if (p == null || !String(p).trim()) return '#';
    return `tel:${String(p).replace(/\s/g, '')}`;
  }

  editListingLink(apt: Apartment | null): string[] {
    if (!apt?.id) return ['/estate/submit'];
    return ['/estate/apartment', String(apt.id), 'edit'];
  }

  confirmDeleteListing(): void {
    const apt = this.apartment();
    const id = apt?.id;
    if (id == null || !this.isOwner(apt) || this.ownerActionLoading()) return;
    if (!confirm('Снять объявление с публикации? Его не будет видно в каталоге.')) return;
    this.ownerActionLoading.set(true);
    this.mortgageApi.deleteApartment(id).subscribe({
      next: () => {
        this.ownerActionLoading.set(false);
        void this.router.navigate(['/profile/my-listings']);
      },
      error: (err) => {
        this.ownerActionLoading.set(false);
        const d = err?.error?.detail;
        this.error.set(
          typeof d === 'string' ? d : err?.message ?? 'Не удалось удалить объявление',
        );
      },
    });
  }
}
