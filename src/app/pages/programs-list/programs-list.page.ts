import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WheelPaginationComponent } from '../../components/ui';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { getBankLogoPath } from '../../core/utils/bank-logo';
import type { ProgramListItem } from '../../core/interfaces/mortgage.types';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-programs-list-page',
  standalone: true,
  imports: [RouterLink, WheelPaginationComponent],
  templateUrl: './programs-list.page.html',
  styleUrl: './programs-list.page.scss',
})
export class ProgramsListPage implements OnInit {
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);

  programs = signal<ProgramListItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPage(1);
    }
  }

  loadPage(page: number): void {
    this.error.set(null);
    this.loading.set(true);
    this.mortgageApi.getPrograms(page, PAGE_SIZE).subscribe({
      next: (res) => {
        this.programs.set(res.results ?? []);
        this.totalCount.set(res.count ?? res.results?.length ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? err?.message ?? 'Ошибка загрузки списка';
        this.error.set(msg);
      },
    });
  }

  formatMoney(value: string | null | undefined): string {
    if (value == null || value === '') {
      return '—';
    }
    const num = parseFloat(value);
    if (Number.isNaN(num)) {
      return '—';
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  housingTypeLabel(type: string): string {
    return type === 'primary' ? 'Первичка' : type === 'secondary' ? 'Вторичка' : type;
  }

  getBankLogo(bankName: string): string | null {
    return getBankLogoPath(bankName);
  }
}
