import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserApiService } from '../../core/services/user-api.service';
import type { ApartmentListItem } from '../../core/interfaces/user.types';

@Component({
  selector: 'app-my-listings-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './my-listings.page.html',
  styleUrl: './my-listings.page.scss',
})
export class MyListingsPage implements OnInit {
  private readonly userApi = inject(UserApiService);
  private readonly translate = inject(TranslateService);

  apartments = signal<ApartmentListItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error.set(null);
    this.loading.set(true);
    this.userApi.getMyListings().subscribe({
      next: (list) => {
        this.apartments.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('myListings.errLoad'));
      },
    });
  }

  formatMoney(value: string | number | undefined): string {
    if (value == null) return this.translate.instant('mortgage.dash');
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (Number.isNaN(num)) return String(value);
    const lang = this.translate.getCurrentLang() || 'ru';
    const locale = lang === 'en' ? 'en-US' : lang === 'kk' ? 'kk-KZ' : 'ru-KZ';
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
