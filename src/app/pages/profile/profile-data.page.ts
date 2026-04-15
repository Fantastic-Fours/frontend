import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

type PrivilegeOption = { value: string };

@Component({
  selector: 'app-profile-data',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile-data.page.html',
  styleUrl: './profile-data.page.scss',
})
export class ProfileDataPage implements OnInit {
  private readonly authTokens = inject(AuthTokenService);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly userApi = inject(UserApiService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly privilegeOptions: PrivilegeOption[] = [
    { value: 'veteran_ww2' },
    { value: 'veteran_equivalent' },
    { value: 'combat_veteran' },
    { value: 'disabled_group_1' },
    { value: 'disabled_group_2' },
    { value: 'family_with_disabled_child' },
    { value: 'widow' },
    { value: 'large_family' },
    { value: 'orphan' },
  ];

  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  editMode = signal(false);
  saving = signal(false);
  profileForm: FormGroup = this.fb.nonNullable.group({
    phone: [''],
    privileges: [[] as string[]],
  });

  isAuthenticated = computed(() => this.authTokens.hasTokens());

  ngOnInit(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/login']);
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
        this.profileForm.patchValue({
          phone: data.phone ?? '',
          privileges: data.privileges ?? [],
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

  toggleEdit(): void {
    const nextValue = !this.editMode();
    this.editMode.set(nextValue);
    if (nextValue) {
      const p = this.profile();
      this.profileForm.patchValue({
        phone: p?.phone ?? '',
        privileges: p?.privileges ?? [],
      });
    }
  }

  saveProfile(): void {
    const raw = this.profileForm.getRawValue();
    this.saving.set(true);
    this.userApi
      .patchMe({
        phone: raw.phone || undefined,
        privileges: raw.privileges ?? [],
      })
      .subscribe({
        next: (data) => {
          this.profile.set(data);
          this.editMode.set(false);
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.detail ?? err?.message ?? this.translate.instant('profilePage.errSave'));
          this.saving.set(false);
        },
      });
  }

  isPrivilegeSelected(value: string): boolean {
    const selected = (this.profileForm.get('privileges')?.value as string[] | null) ?? [];
    return selected.includes(value);
  }

  onPrivilegeToggle(value: string, checked: boolean): void {
    const current = new Set((this.profileForm.get('privileges')?.value as string[] | null) ?? []);
    if (checked) current.add(value);
    else current.delete(value);
    this.profileForm.patchValue({ privileges: Array.from(current) });
  }

  getPrivilegeLabels(privileges?: string[] | null): string {
    if (!privileges || privileges.length === 0) {
      return this.translate.instant('mortgage.dash');
    }
    const labels = privileges
      .map((value) => this.translate.instant('mortgage.privilege.' + value))
      .join(', ');
    return labels || this.translate.instant('mortgage.dash');
  }
}
