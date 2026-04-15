import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AIConsultantApiService } from '../../core/services/ai-consultant-api.service';
import { MarkdownPipe } from '../../core/pipes/markdown.pipe';
import type { AIChatHistoryItem, AIChatResponse } from '../../core/interfaces/ai-consultant.types';
import { AuthTokenService } from '../../core/services/auth-token.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  suggestedPrograms?: string[] | unknown[];
  suggestedApartmentIds?: number[] | unknown[];
  ragSources?: { program_id: number | null; program_name?: string | null; bank_name?: string | null }[];
}

@Component({
  selector: 'app-ai-consultant-page',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslatePipe, MarkdownPipe],
  templateUrl: './ai-consultant.page.html',
  styleUrl: './ai-consultant.page.scss',
})
export class AIConsultantPage implements OnInit {
  private readonly aiApi = inject(AIConsultantApiService);
  private readonly authTokens = inject(AuthTokenService);
  private readonly translate = inject(TranslateService);

  message = '';
  loading = signal(false);
  error = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);

  /** Optional context — любое поле можно оставить пустым. */
  contextIncome = '';
  contextDownPayment = '';
  contextTermYears = '';
  contextHousingType = '';

  /** Использовать поиск по базе программ (RAG / FAISS). */
  useRag = true;

  private static readonly MAX_HISTORY_TURNS = 24;

  get isAuthenticated(): boolean {
    return this.authTokens.hasTokens();
  }

  ngOnInit(): void {
    this.loadPersistedHistory();
  }

  loadPersistedHistory(): void {
    if (!this.isAuthenticated) return;
    this.aiApi.history().subscribe({
      next: (res) => {
        const hydrated: ChatMessage[] = (res.messages || []).map((m) => ({
          role: m.role,
          text: m.content,
          ragSources: m.rag_used ? (m.rag_sources ?? []) : [],
        }));
        this.messages.set(hydrated);
      },
      error: () => {
        // Keep local empty state if history is unavailable.
      },
    });
  }

  clearPersistedHistory(): void {
    if (!this.isAuthenticated) return;
    this.aiApi.clearHistory().subscribe({
      next: () => {
        this.messages.set([]);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ?? err?.message ?? this.translate.instant('aiPage.errClearHistory'),
        );
      },
    });
  }

  send(): void {
    const text = (this.message || '').trim();
    if (!text) return;
    this.error.set(null);

    if (this.useRag && !this.isAuthenticated) {
      this.error.set(this.translate.instant('aiPage.errRagNeedLogin'));
      return;
    }

    const prior = this.messages();
    const history: AIChatHistoryItem[] = prior
      .slice(-AIConsultantPage.MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.text }));

    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.message = '';
    this.loading.set(true);

    const context: {
      income?: number;
      down_payment?: number;
      term_years?: number;
      housing_type?: string;
    } = {};
    const income = parseFloat(this.contextIncome);
    if (!Number.isNaN(income) && this.contextIncome.trim() !== '') context.income = income;
    const down = parseFloat(this.contextDownPayment);
    if (!Number.isNaN(down) && this.contextDownPayment.trim() !== '') context.down_payment = down;
    const term = parseInt(this.contextTermYears, 10);
    if (!Number.isNaN(term) && this.contextTermYears.trim() !== '') context.term_years = term;
    if (this.contextHousingType.trim()) context.housing_type = this.contextHousingType.trim();

    this.aiApi
      .chat({
        message: text,
        context: Object.keys(context).length ? context : undefined,
        history: history.length ? history : undefined,
        use_rag: this.useRag,
      })
      .subscribe({
        next: (res: AIChatResponse) => {
          this.messages.update((m) => [
            ...m,
            {
              role: 'assistant',
              text: res.reply,
              suggestedPrograms: res.suggested_programs ?? [],
              suggestedApartmentIds: res.suggested_apartments ?? [],
              ragSources: res.rag_used ? (res.rag_sources ?? []) : [],
            },
          ]);
          this.loading.set(false);
        },
        error: (err) => {
          const d = err?.error?.detail;
          const detail =
            typeof d === 'string'
              ? d
              : Array.isArray(d)
                ? d.map((x: { string?: string }) => x?.string ?? '').filter(Boolean).join(' ')
                : err?.message;
          this.error.set(detail ?? this.translate.instant('aiPage.err'));
          this.messages.update((m) => [
            ...m,
            { role: 'assistant', text: this.translate.instant('aiPage.fallback') },
          ]);
          this.loading.set(false);
        },
      });
  }
}
