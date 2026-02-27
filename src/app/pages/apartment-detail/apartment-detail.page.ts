import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import type { Apartment } from '../../core/interfaces/apartment.types';

@Component({
  selector: 'app-apartment-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './apartment-detail.page.html',
  styleUrl: './apartment-detail.page.scss',
})
export class ApartmentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mortgageApi = inject(MortgageApiService);

  apartment = signal<Apartment | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

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
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки');
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

  /** Allowed programs from API (array of { id, name, bank_name, interest_rate }). */
  getProgramsList(apt: Apartment): { id: number; name: string; bank_name: string; interest_rate: number }[] {
    const list = apt['allowed_programs'];
    return Array.isArray(list) ? list : [];
  }

  backLink(): string {
    const apt = this.apartment();
    if (apt?.housing_type === 'secondary') return '/estate/secondary';
    return '/estate/primary';
  }
}
