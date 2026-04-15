import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserApiService } from '../../core/services/user-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { ProfileRefreshService } from '../../core/services/profile-refresh.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile-settings.page.html',
  styleUrl: './profile-settings.page.scss',
})
export class ProfileSettingsPage implements OnInit {
  private readonly userApi = inject(UserApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly authTokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly profileRefresh = inject(ProfileRefreshService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedOk = signal(false);

  readonly form = this.fb.nonNullable.group({
    first_name: [''],
    last_name: [''],
  });

  readonly username = signal('');
  readonly email = signal('');

  ngOnInit(): void {
    if (!this.authTokens.hasTokens()) {
      void this.router.navigate(['/login']);
      return;
    }
    this.userApi.getMe().subscribe({
      next: (p) => {
        this.username.set(p.username);
        this.email.set(p.email);
        this.form.patchValue({
          first_name: (p.first_name ?? '').trim(),
          last_name: (p.last_name ?? '').trim(),
        });
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 401) {
          this.authApi.logout();
          void this.router.navigate(['/login']);
        } else {
          this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('profilePage.errLoad'));
        }
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.savedOk.set(false);
    this.userApi
      .patchMe({
        first_name: raw.first_name,
        last_name: raw.last_name,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.savedOk.set(true);
          this.profileRefresh.notify();
        },
        error: (err) => {
          this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('profilePage.errSave'));
          this.saving.set(false);
        },
      });
  }
}
