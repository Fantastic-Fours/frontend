import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AuthTokenService } from '../../core/services/auth-token.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { UserApiService } from '../../core/services/user-api.service';
import type { UserProfile } from '../../core/interfaces/user.types';

type PrivilegeOption = {
  value: string;
  label: string;
};

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
  readonly privilegeOptions: PrivilegeOption[] = [
    { value: 'veteran_ww2', label: 'Ветеран ВОВ' },
    { value: 'veteran_equivalent', label: 'Приравненный к ветерану ВОВ' },
    { value: 'combat_veteran', label: 'Ветеран боевых действий' },
    { value: 'disabled_group_1', label: 'Инвалид I группы' },
    { value: 'disabled_group_2', label: 'Инвалид II группы' },
    { value: 'family_with_disabled_child', label: 'Семья с ребенком-инвалидом' },
    { value: 'widow', label: 'Вдова' },
    { value: 'large_family', label: 'Многодетная семья' },
    { value: 'orphan', label: 'Сирота' },
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
        this.profileForm.patchValue({
          phone: data.phone ?? '',
          privileges: data.privileges ?? [],
        });
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
    const nextValue = !this.editMode();
    this.editMode.set(nextValue);
    if (nextValue) {
      const profile = this.profile();
      this.profileForm.patchValue({
        phone: profile?.phone ?? '',
        privileges: profile?.privileges ?? [],
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
          this.error.set(err?.error?.detail ?? err?.message ?? 'Ошибка сохранения');
          this.saving.set(false);
        },
      });
  }

  isPrivilegeSelected(value: string): boolean {
    const selected = (this.profileForm.get('privileges')?.value as string[] | null) ?? [];
    return selected.includes(value);
  }

  onPrivilegeToggle(value: string, checked: boolean): void {
    const current = new Set(((this.profileForm.get('privileges')?.value as string[] | null) ?? []));
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    this.profileForm.patchValue({ privileges: Array.from(current) });
  }

  getPrivilegeLabels(privileges?: string[] | null): string {
    if (!privileges || privileges.length === 0) {
      return '—';
    }
    const labels = privileges
      .map((value) => this.privilegeOptions.find((item) => item.value === value)?.label ?? value)
      .join(', ');
    return labels || '—';
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
