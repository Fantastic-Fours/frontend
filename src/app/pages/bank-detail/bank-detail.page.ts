import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  PLATFORM_ID,
  Injector,
  ElementRef,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { load } from '@2gis/mapgl';
import type { Map as Map2gis, Marker as Marker2gis } from '@2gis/mapgl/types';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { resolveBankLogo } from '../../core/utils/bank-logo';
import { getTwogisApiKey } from '../../core/constants/twogis.constants';
import type { Bank, BankBranch } from '../../core/interfaces/mortgage.types';

@Component({
  selector: 'app-bank-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bank-detail.page.html',
  styleUrl: './bank-detail.page.scss',
})
export class BankDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  @ViewChild('mapHost') mapHost?: ElementRef<HTMLElement>;

  bank = signal<Bank | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  mapError = signal<string | null>(null);

  readonly resolveBankLogo = resolveBankLogo;

  private map: Map2gis | null = null;
  private branchMarkers: Marker2gis[] = [];

  bankId = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  ngOnInit(): void {
    const id = this.bankId();
    if (id == null || Number.isNaN(id)) {
      this.error.set('Неверный ID банка');
      this.loading.set(false);
      return;
    }
    this.mortgageApi.getBank(id).subscribe({
      next: (data) => {
        this.mapError.set(null);
        this.destroyBranchesMap();
        this.bank.set(data);
        this.loading.set(false);
        if ((data.branches?.length ?? 0) > 0) {
          afterNextRender(
            () => {
              void this.initBranchesMap();
            },
            { injector: this.injector }
          );
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки банка');
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyBranchesMap();
  }

  bankSectionText(value: string | null | undefined): boolean {
    return Boolean(value && String(value).trim());
  }

  branches(b: Bank): BankBranch[] {
    return b.branches ?? [];
  }

  reviews(b: Bank): NonNullable<Bank['reviews']> {
    return b.reviews ?? [];
  }

  /** Центр карты и одна ссылка 2GIS без показа координат в списке. */
  branchesMapCenter(b: Bank): { lon: number; lat: number } | null {
    const list = this.branches(b);
    if (!list.length) return null;
    const lats = list.map((x) => x.latitude);
    const lons = list.map((x) => x.longitude);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lon: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  }

  twogisOpenUrl(b: Bank): string | null {
    const c = this.branchesMapCenter(b);
    if (!c) return null;
    const z = this.branches(b).length === 1 ? 16 : 13;
    return `https://2gis.kz/astana?m=${c.lon}%2C${c.lat}%2F${z}`;
  }

  stars(score: number): string {
    const s = Math.min(5, Math.max(1, Math.round(score)));
    return '★'.repeat(s) + '☆'.repeat(5 - s);
  }

  formatDateTime(iso: string): string {
    try {
      return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(iso)
      );
    } catch {
      return iso;
    }
  }

  private destroyBranchesMap(): void {
    for (const m of this.branchMarkers) {
      m.destroy();
    }
    this.branchMarkers = [];
    this.map?.destroy();
    this.map = null;
  }

  private async initBranchesMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const b = this.bank();
    const branches = b ? this.branches(b) : [];
    if (!branches.length) return;
    const el = this.mapHost?.nativeElement;
    if (!el) return;
    const apiKey = getTwogisApiKey();
    if (!apiKey) {
      this.mapError.set('Укажите ключ 2GIS в twogis.constants.ts для отображения карты.');
      return;
    }
    this.destroyBranchesMap();
    const lats = branches.map((br) => br.latitude);
    const lons = branches.map((br) => br.longitude);
    const center: [number, number] = [
      (Math.min(...lons) + Math.max(...lons)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
    const zoom = branches.length === 1 ? 15 : 12;
    try {
      const mapgl = await load();
      this.map = new mapgl.Map(el, {
        key: apiKey,
        center,
        zoom,
      });
      for (const br of branches) {
        const marker = new mapgl.Marker(this.map, {
          coordinates: [br.longitude, br.latitude],
        });
        this.branchMarkers.push(marker);
      }
    } catch {
      this.mapError.set('Не удалось загрузить карту 2GIS.');
    }
  }
}
