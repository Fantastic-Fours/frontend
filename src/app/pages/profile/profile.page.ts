import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  private readonly authTokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly fb = inject(FormBuilder);

  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  editMode = signal(false);
  saving = signal(false);
  profileForm: FormGroup = this.fb.nonNullable.group({
    phone: [''],
  });

  isAuthenticated = computed(() => this.authTokens.hasTokens());

  ngOnInit(): void {
    if (!this.isAuthenticated()) {
      this.loading.set(false);
      return;
    }
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.userApi.getMe().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.profileForm.patchValue({ phone: data.phone ?? '' });
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 401) {
          this.authApi.logout();
          this.router.navigate(['/login']);
        } else {
          this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка загрузки профиля');
        }
        this.loading.set(false);
      },
    });
  }

  toggleEdit(): void {
    this.editMode.update((v) => !v);
  }

  saveProfile(): void {
    const raw = this.profileForm.getRawValue();
    this.saving.set(true);
    this.userApi.patchMe({ phone: raw.phone || undefined }).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.editMode.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка сохранения');
        this.saving.set(false);
      },
    });
  }

  logout(): void {
    this.authApi.logout();
    this.profile.set(null);
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
