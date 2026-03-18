import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import type { Apartment } from '../../core/interfaces/apartment.types';

@Component({
  selector: 'app-apartment-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './apartment-detail.page.html',
  styleUrl: './apartment-detail.page.scss',
})
export class ApartmentDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly userApi = inject(UserApiService);
  private readonly authTokens = inject(AuthTokenService);
  private readonly platformId = inject(PLATFORM_ID);

  apartment = signal<Apartment | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  /** SavedApartment id if this apartment is in user's saved list. */
  savedId = signal<number | null>(null);
  saving = signal(false);

  isAuthenticated = computed(() => this.authTokens.hasTokens());
  slideIndex = signal(0);
  autoplay = signal(true);
  private autoplayHandle: number | null = null;

  id = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  housingTypeLabel(type: string): string {
    return type === 'primary' ? 'Первичка' : type === 'secondary' ? 'Вторичка' : type;
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
        this.apartment.set(data);
        this.slideIndex.set(0);
        this.setupAutoplay();
        this.loading.set(false);
        if (this.authTokens.hasTokens()) {
          this.userApi.getSavedApartments(1, 100).subscribe({
            next: (res) => {
              const found = res.results?.find((item) => item.apartment?.id === data.id);
              if (found) this.savedId.set(found.id);
            },
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки');
      },
    });
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
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

  backLink(): string {
    const apt = this.apartment();
    if (apt?.housing_type === 'secondary') return '/estate/secondary';
    return '/estate/primary';
  }
}
