import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MortgageApiService } from '../../core/services/mortgage-api.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { KZ_BIG_CITIES } from '../../core/constants/kz-cities.constants';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';

@Component({
  selector: 'app-submit-ad-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './submit-ad.page.html',
  styleUrl: './submit-ad.page.scss',
})
export class SubmitAdPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mortgageApi = inject(MortgageApiService);
  private readonly authTokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApiService);

  form!: FormGroup;
  error: string | null = null;
  loading = false;
  submitted = false;
  cities = KZ_BIG_CITIES;
  selectedFiles: File[] = [];
  profile: UserProfile | null = null;
  profileLoading = true;
  canSubmit = false;

  ngOnInit(): void {
    if (!this.authTokens.hasTokens()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/estate/submit' } });
      return;
    }
    this.userApi.getMe().subscribe({
      next: (p) => {
        this.profile = p;
        this.profileLoading = false;
        this.canSubmit = Boolean(p?.phone && String(p.phone).trim().length > 0);
      },
      error: () => {
        this.profileLoading = false;
        this.canSubmit = false;
      },
    });
    this.form = this.fb.nonNullable.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: [''],
      price: [null as number | null, [Validators.required, Validators.min(1)]],
      city: ['Алматы', Validators.required],
      address: [''],
      area_sqm: [null as number | null, [Validators.min(1)]],
      rooms: [null as number | null, [Validators.min(0)]],
      floor: [null as number | null, [Validators.min(0)]],
      total_floors: [null as number | null, [Validators.min(0)]],
      housing_type: ['primary' as 'primary' | 'secondary', Validators.required],
      property_type: ['apartment' as 'apartment' | 'house', Validators.required],
      allowed_program_ids: [[] as number[]],
    });
  }

  onFilesSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.selectedFiles = files;
  }

  onSubmit(): void {
    if (!this.form) return;
    if (!this.canSubmit) {
      this.error = 'Чтобы подать объявление, укажите номер телефона в профиле.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = null;
    this.loading = true;
    this.submitted = true;
    const raw = this.form.getRawValue();
    const body = {
      title: raw.title,
      description: raw.description || undefined,
      price: raw.price,
      city: raw.city,
      address: raw.address || undefined,
      property_type: raw.property_type,
      area_sqm: raw.area_sqm ?? undefined,
      rooms: raw.rooms ?? undefined,
      floor: raw.floor ?? undefined,
      total_floors: raw.total_floors ?? undefined,
      housing_type: raw.housing_type,
      images_files: this.selectedFiles,
      allowed_program_ids: raw.allowed_program_ids ?? [],
    };
    this.mortgageApi.createApartment(body).subscribe({
      next: (created) => {
        this.loading = false;
        this.router.navigate(['/estate/apartment', created.id]);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.title?.[0]
          ?? err?.error?.price?.[0]
          ?? err?.error?.city?.[0]
          ?? err?.error?.detail
          ?? 'Ошибка при создании объявления. Проверьте данные.';
        this.error = typeof msg === 'string' ? msg : JSON.stringify(msg);
      },
    });
  }
}
