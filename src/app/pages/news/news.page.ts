import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import type { MortgageNewsItem } from '../../core/interfaces/news.types';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './news.page.html',
  styleUrl: './news.page.scss',
})
export class NewsPage implements OnInit {
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);

  news = signal<MortgageNewsItem[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);

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
    this.mortgageApi.getNews(page, PAGE_SIZE).subscribe({
      next: (res) => {
        this.news.set(res.results ?? []);
        this.totalCount.set(res.count ?? res.results?.length ?? 0);
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? err?.message ?? 'Ошибка загрузки новостей';
        this.error.set(msg);
      },
    });
  }

  nextPage(): void {
    if (this.hasNext()) this.loadPage(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.loadPage(this.currentPage() - 1);
  }

  formatDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
