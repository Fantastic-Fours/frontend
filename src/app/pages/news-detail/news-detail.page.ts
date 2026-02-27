import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import type { MortgageNewsItem } from '../../core/interfaces/news.types';

@Component({
  selector: 'app-news-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './news-detail.page.html',
  styleUrl: './news-detail.page.scss',
})
export class NewsDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mortgageApi = inject(MortgageApiService);

  item = signal<MortgageNewsItem | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  id = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? parseInt(id, 10) : null;
  });

  ngOnInit(): void {
    const id = this.id();
    if (id == null || Number.isNaN(id)) {
      this.error.set('Неверный ID новости');
      this.loading.set(false);
      return;
    }
    this.mortgageApi.getNewsItem(id).subscribe({
      next: (data) => {
        this.item.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки новости');
      },
    });
  }

  formatDate(value: string): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
