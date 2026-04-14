import { Component, OnInit, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { resolveBankLogo } from '../../core/utils/bank-logo';
import type { ProgramListItem } from '../../core/interfaces/mortgage.types';
import { formatPrivilegeLabels } from '../../core/utils/privilege-labels';

const PAGE_SIZE = 10;

type HousingTypeValue = 'primary' | 'secondary';

interface ProgramCardItem extends ProgramListItem {
  housing_types: HousingTypeValue[];
}

@Component({
  selector: 'app-programs-list-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './programs-list.page.html',
  styleUrl: './programs-list.page.scss',
})
export class ProgramsListPage implements OnInit {
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly platformId = inject(PLATFORM_ID);

  programs = signal<ProgramCardItem[]>([]);
  currentPage = signal(1);
  loading = signal(false);
  error = signal<string | null>(null);
  search = signal('');
  selectedBank = signal('all');
  selectedHousingType = signal<'all' | HousingTypeValue>('all');
  onlyGovernment = signal(false);
  onlyPrivileged = signal(false);

  banks = computed(() => {
    const values = new Set(this.programs().map((p) => p.bank_name).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ru'));
  });

  filteredPrograms = computed(() => {
    const query = this.search().trim().toLowerCase();
    const bank = this.selectedBank();
    const housing = this.selectedHousingType();

    return this.programs().filter((p) => {
      if (bank !== 'all' && p.bank_name !== bank) return false;
      if (housing !== 'all' && !p.housing_types.includes(housing)) return false;
      if (this.onlyGovernment() && !p.is_government_program) return false;
      if (this.onlyPrivileged() && !p.is_privileged_program) return false;
      if (!query) return true;
      const haystack = `${p.name} ${p.bank_name}`.toLowerCase();
      return haystack.includes(query);
    });
  });

  pagedPrograms = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredPrograms().slice(start, start + PAGE_SIZE);
  });

  totalCount = computed(() => this.filteredPrograms().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / PAGE_SIZE)));
  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllPrograms(1, []);
    }
  }

  private loadAllPrograms(page: number, acc: ProgramListItem[]): void {
    if (page === 1) {
      this.error.set(null);
      this.loading.set(true);
    }
    this.mortgageApi.getPrograms(page, 100).subscribe({
      next: (res) => {
        const merged = [...acc, ...(res.results ?? [])];
        if (res.next) {
          const nextPage = this.extractPageFromUrl(res.next);
          if (nextPage != null) {
            this.loadAllPrograms(nextPage, merged);
            return;
          }
        }
        this.programs.set(this.groupPrograms(merged));
        this.currentPage.set(1);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail ?? err?.message ?? 'Ошибка загрузки списка';
        this.error.set(msg);
      },
    });
  }

  private extractPageFromUrl(url: string): number | null {
    const match = /[?&]page=(\d+)/.exec(url);
    if (!match) return null;
    const parsed = parseInt(match[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private groupPrograms(rows: ProgramListItem[]): ProgramCardItem[] {
    const map = new Map<string, ProgramCardItem>();
    for (const row of rows) {
      const key = `${row.bank}|${row.name.trim().toLowerCase()}`;
      const type = row.housing_type === 'secondary' ? 'secondary' : 'primary';
      const found = map.get(key);
      if (!found) {
        map.set(key, {
          ...row,
          housing_types: [type],
        });
        continue;
      }
      found.id = Math.min(found.id, row.id);
      found.max_term_years = Math.max(found.max_term_years ?? 0, row.max_term_years ?? 0);
      if (!found.housing_types.includes(type)) found.housing_types.push(type);

      const minDown = this.minNumericString(found.min_down_payment_percent, row.min_down_payment_percent);
      if (minDown != null) found.min_down_payment_percent = minDown;

      const maxLoan = this.maxNumericString(found.max_loan_amount, row.max_loan_amount);
      if (maxLoan != null) found.max_loan_amount = maxLoan;

      const minRate = this.minNumericString(found.interest_rate, row.interest_rate);
      if (minRate != null) found.interest_rate = minRate;
      found.is_government_program = Boolean(found.is_government_program || row.is_government_program);
      found.is_privileged_program = Boolean(found.is_privileged_program || row.is_privileged_program);
      found.eligible_privileges = Array.from(
        new Set([...(found.eligible_privileges ?? []), ...(row.eligible_privileges ?? [])])
      );
    }
    return Array.from(map.values()).sort((a, b) => {
      const byBank = a.bank_name.localeCompare(b.bank_name, 'ru');
      if (byBank !== 0) return byBank;
      return a.name.localeCompare(b.name, 'ru');
    });
  }

  private parseNum(value: string | null | undefined): number | null {
    if (value == null || value === '') return null;
    const n = parseFloat(String(value).replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }

  private minNumericString(a: string | null | undefined, b: string | null | undefined): string | null {
    const an = this.parseNum(a);
    const bn = this.parseNum(b);
    if (an == null && bn == null) return null;
    if (an == null) return String(b);
    if (bn == null) return String(a);
    return String(Math.min(an, bn));
  }

  private maxNumericString(a: string | null | undefined, b: string | null | undefined): string | null {
    const an = this.parseNum(a);
    const bn = this.parseNum(b);
    if (an == null && bn == null) return null;
    if (an == null) return String(b);
    if (bn == null) return String(a);
    return String(Math.max(an, bn));
  }

  nextPage(): void {
    if (this.hasNext()) this.currentPage.set(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.hasPrev()) this.currentPage.set(this.currentPage() - 1);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  onBankChange(value: string): void {
    this.selectedBank.set(value);
    this.currentPage.set(1);
  }

  onHousingTypeChange(value: 'all' | HousingTypeValue): void {
    this.selectedHousingType.set(value);
    this.currentPage.set(1);
  }

  toggleGovernment(checked: boolean): void {
    this.onlyGovernment.set(checked);
    this.currentPage.set(1);
  }

  togglePrivileged(checked: boolean): void {
    this.onlyPrivileged.set(checked);
    this.currentPage.set(1);
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

  housingTypeSummary(types: string[]): string {
    if (!types || types.length === 0) return '—';
    return types.map((t) => this.housingTypeLabel(t)).join(', ');
  }

  getBankLogo(p: ProgramCardItem): string | null {
    return resolveBankLogo(p.bank_logo, p.bank_name);
  }

  privilegeSummary(p: ProgramListItem): string {
    return formatPrivilegeLabels(p.eligible_privileges);
  }
}
