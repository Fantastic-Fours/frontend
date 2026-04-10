import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { load } from '@2gis/mapgl';
import type { Map as Map2gis, MapPointerEvent, Marker as Marker2gis } from '@2gis/mapgl/types';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { KZ_BIG_CITIES } from '../../core/constants/kz-cities.constants';
import { mapCenterForCity } from '../../core/constants/kz-city-map-centers.constants';
import { getTwogisApiKey } from '../../core/constants/twogis.constants';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';

@Component({
  selector: 'app-submit-ad-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './submit-ad.page.html',
  styleUrl: './submit-ad.page.scss',
})
export class SubmitAdPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly authTokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  @ViewChild('mapHost') mapHost?: ElementRef<HTMLElement>;

  form!: FormGroup;
  error: string | null = null;
  loading = false;
  submitted = false;
  cities = KZ_BIG_CITIES;
  selectedFiles: File[] = [];
  profile: UserProfile | null = null;
  profileLoading = true;
  canSubmit = false;

  mapError: string | null = null;
  geocoding = false;

  private map: Map2gis | null = null;
  private marker: Marker2gis | null = null;
  private mapglApi: typeof import('@2gis/mapgl/types') | null = null;

  ngOnInit(): void {
    if (!this.authTokens.hasTokens()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/estate/submit' } });
      return;
    }
    this.userApi.getMe().subscribe({
      next: (p) => {
        this.profile = p;
        this.profileLoading = false;
        this.canSubmit = Boolean(p?.phone && String(p.phone).trim().length > 0);
      },
      error: () => {
        this.profileLoading = false;
        this.canSubmit = false;
      },
    });
    this.form = this.fb.nonNullable.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      price: [null as number | null, [Validators.required, Validators.min(1)]],
      city: ['Алматы', Validators.required],
      address: [''],
      lat: [null as number | null],
      lng: [null as number | null],
      area_sqm: [null as number | null, [Validators.min(1)]],
      rooms: [null as number | null, [Validators.min(0)]],
      floor: [null as number | null, [Validators.min(0)]],
      total_floors: [null as number | null, [Validators.min(0)]],
      housing_type: ['primary' as 'primary' | 'secondary', Validators.required],
      property_type: ['apartment' as 'apartment' | 'house', Validators.required],
      allowed_program_ids: [[] as number[]],
    });

    this.form
      .get('city')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((city) => {
        if (!this.map) return;
        this.map.setCenter(mapCenterForCity(city));
      });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!getTwogisApiKey()) {
      this.mapError =
        'Укажите демо-ключ 2GIS: в twogis.constants.ts (TWOGIS_API_KEY_FILE) или window.__TWOGIS_API_KEY__ в index.html';
      return;
    }
    void this.initMap();
  }

  ngOnDestroy(): void {
    this.marker?.destroy();
    this.marker = null;
    this.map?.destroy();
    this.map = null;
  }

  private async initMap(): Promise<void> {
    const el = this.mapHost?.nativeElement;
    if (!el || !this.form) return;
    try {
      const apiKey = getTwogisApiKey();
      this.mapglApi = await load();
      const center = mapCenterForCity(this.form.get('city')?.value);
      this.map = new this.mapglApi.Map(el, {
        key: apiKey,
        center,
        zoom: 12,
      });
      this.map.on('click', (e: MapPointerEvent) => {
        if (!this.mapglApi || !this.map || !this.form) return;
        const [lng, lat] = e.lngLat;
        const latN = Number(lat.toFixed(7));
        const lngN = Number(lng.toFixed(7));
        this.marker?.destroy();
        this.marker = new this.mapglApi.Marker(this.map, { coordinates: [lngN, latN] });
        this.ngZone.run(() => {
          this.form.patchValue({ lat: latN, lng: lngN });
        });
        void this.reverseGeocode(latN, lngN);
      });
    } catch {
      this.mapError = 'Не удалось загрузить карту 2GIS. Проверьте ключ и сеть.';
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    const apiKey = getTwogisApiKey();
    if (!apiKey) return;
    this.ngZone.run(() => {
      this.geocoding = true;
    });
    try {
      const url = new URL('https://catalog.api.2gis.com/3.0/items/geocode');
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('fields', 'items.address_name,items.full_name');
      url.searchParams.set('key', apiKey);
      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        result?: { items?: { full_name?: string; address_name?: string }[] };
      };
      const item = data?.result?.items?.[0];
      const line = item?.full_name ?? item?.address_name;
      if (line) {
        this.ngZone.run(() => {
          this.form.patchValue({ address: line }, { emitEvent: false });
        });
      }
    } catch {
      /* optional: ignore geocode errors */
    } finally {
      this.ngZone.run(() => {
        this.geocoding = false;
      });
    }
  }

  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.selectedFiles = files;
  }

  onSubmit(): void {
    if (!this.form) return;
    if (!this.canSubmit) {
      this.error = 'Чтобы подать объявление, укажите номер телефона в профиле.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = null;
    this.loading = true;
    this.submitted = true;
    const raw = this.form.getRawValue();
    const body = {
      title: raw.title,
      description: raw.description || undefined,
      price: raw.price,
      city: raw.city,
      address: raw.address || undefined,
      latitude: raw.lat ?? undefined,
      longitude: raw.lng ?? undefined,
      property_type: raw.property_type,
      area_sqm: raw.area_sqm ?? undefined,
      rooms: raw.rooms ?? undefined,
      floor: raw.floor ?? undefined,
      total_floors: raw.total_floors ?? undefined,
      housing_type: raw.housing_type,
      images_files: this.selectedFiles,
      allowed_program_ids: raw.allowed_program_ids ?? [],
    };
    this.mortgageApi.createApartment(body).subscribe({
      next: (created) => {
        this.loading = false;
        this.router.navigate(['/estate/apartment', created.id]);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.title?.[0]
          ?? err?.error?.price?.[0]
          ?? err?.error?.city?.[0]
          ?? err?.error?.detail
          ?? 'Ошибка при создании объявления. Проверьте данные.';
        this.error = typeof msg === 'string' ? msg : JSON.stringify(msg);
      },
    });
  }
}
