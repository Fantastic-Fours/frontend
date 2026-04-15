import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { resolveBankLogo } from '../../core/utils/bank-logo';
import type { Bank } from '../../core/interfaces/mortgage.types';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-banks-list-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './banks-list.page.html',
  styleUrl: './banks-list.page.scss',
})
export class BanksListPage implements OnInit {
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(TranslateService);

  banks = signal<Bank[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  readonly resolveBankLogo = resolveBankLogo;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPage(1);
    }
  }

  loadPage(page: number): void {
    this.error.set(null);
    this.loading.set(true);
    this.mortgageApi.getBanks(page, PAGE_SIZE).subscribe({
      next: (res) => {
        this.banks.set(res.results ?? []);
        this.totalCount.set(res.count ?? res.results?.length ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('banksList.errLoad'));
      },
    });
  }

  nextPage(): void {
    if (this.hasNext()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.loadPage(this.currentPage() - 1);
  }

  branchCount(b: Bank): number {
    return b.branches?.length ?? 0;
  }

  reviewCount(b: Bank): number {
    return b.reviews?.length ?? 0;
  }
}
