import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  step: 'request' | 'reset' = 'request';
  requestForm: FormGroup;
  resetForm: FormGroup;
  error: string | null = null;
  success: string | null = null;
  loading = false;
  resendLoading = false;

  constructor(
    private fb: FormBuilder,
    private authApi: AuthApiService,
    private router: Router
  ) {
    this.requestForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.resetForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  requestCode(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.error = null;
    this.success = null;
    this.loading = true;
    const { email } = this.requestForm.getRawValue();
    this.authApi.forgotPassword({ email }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.detail ?? 'Если email зарегистрирован, код будет отправлен.';
        this.resetForm.patchValue({ email });
        this.step = 'reset';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'Не удалось отправить код.';
      },
    });
  }

  resend(): void {
    const email = this.resetForm.get('email')?.value;
    if (!email || this.resetForm.get('email')?.invalid) {
      this.resetForm.get('email')?.markAsTouched();
      this.error = 'Введите корректный email.';
      return;
    }
    this.error = null;
    this.success = null;
    this.resendLoading = true;
    this.authApi.resendResetCode({ email }).subscribe({
      next: (res) => {
        this.resendLoading = false;
        this.success = res.detail ?? 'Код отправлен повторно.';
      },
      error: (err) => {
        this.resendLoading = false;
        this.error = err?.error?.detail ?? 'Не удалось отправить код.';
      },
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const raw = this.resetForm.getRawValue();
    if (raw.password !== raw.password_confirm) {
      this.error = 'Пароли не совпадают.';
      return;
    }
    this.error = null;
    this.success = null;
    this.loading = true;
    this.authApi.resetPassword(raw).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.detail ?? 'Пароль обновлён.';
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err?.error?.password?.[0] ??
          err?.error?.password_confirm?.[0] ??
          err?.error?.detail ??
          'Не удалось обновить пароль.';
        this.error = typeof msg === 'string' ? msg : String(msg);
      },
    });
  }
}

