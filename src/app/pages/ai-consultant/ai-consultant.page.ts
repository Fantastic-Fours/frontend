import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DigitThousandSepDirective } from '../../shared/digit-thousand-sep.directive';
import { AIConsultantApiService } from '../../core/services/ai-consultant-api.service';
import type { AIChatResponse } from '../../core/interfaces/ai-consultant.types';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  suggestedPrograms?: string[] | unknown[];
  suggestedApartmentIds?: number[] | unknown[];
}

@Component({
  selector: 'app-ai-consultant-page',
  standalone: true,
  imports: [RouterLink, FormsModule, DigitThousandSepDirective],
  templateUrl: './ai-consultant.page.html',
  styleUrl: './ai-consultant.page.scss',
})
export class AIConsultantPage {
  private readonly aiApi = inject(AIConsultantApiService);

  message = '';
  loading = signal(false);
  error = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);

  /** Optional context (can be pre-filled from mortgage match params later). */
  contextIncome = '';
  contextDownPayment = '';
  contextTermYears = '';
  contextHousingType = '';

  send(): void {
    const text = (this.message || '').trim();
    if (!text) return;
    this.error.set(null);
    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.message = '';
    this.loading.set(true);

    const context: { income?: number; down_payment?: number; term_years?: number; housing_type?: string } = {};
    const income = parseFloat(this.contextIncome);
    if (!Number.isNaN(income)) context.income = income;
    const down = parseFloat(this.contextDownPayment);
    if (!Number.isNaN(down)) context.down_payment = down;
    const term = parseInt(this.contextTermYears, 10);
    if (!Number.isNaN(term)) context.term_years = term;
    if (this.contextHousingType.trim()) context.housing_type = this.contextHousingType.trim();

    this.aiApi.chat({ message: text, context: Object.keys(context).length ? context : undefined }).subscribe({
      next: (res: AIChatResponse) => {
        this.messages.update((m) => [
          ...m,
          {
            role: 'assistant',
            text: res.reply,
            suggestedPrograms: res.suggested_programs ?? [],
            suggestedApartmentIds: res.suggested_apartments ?? [],
          },
        ]);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка запроса');
        this.messages.update((m) => [
          ...m,
          { role: 'assistant', text: 'Не удалось получить ответ. Попробуйте позже.' },
        ]);
        this.loading.set(false);
      },
    });
  }
}
