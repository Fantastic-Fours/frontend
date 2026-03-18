import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss',
})
export class VerifyEmailPage {
  form: FormGroup;
  error: string | null = null;
  success: string | null = null;
  loading = false;
  resendLoading = false;

  constructor(
    private fb: FormBuilder,
    private authApi: AuthApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.form = this.fb.nonNullable.group({
      email: [email, [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = null;
    this.success = null;
    this.loading = true;
    const { email, code } = this.form.getRawValue();
    this.authApi.verifyCode({ email, code }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.detail ?? 'Аккаунт подтверждён.';
        setTimeout(() => this.router.navigate(['/login']), 600);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? 'Ошибка подтверждения кода.';
      },
    });
  }

  onResend(): void {
    const email = this.form.get('email')?.value;
    if (!email || this.form.get('email')?.invalid) {
      this.form.get('email')?.markAsTouched();
      this.error = 'Введите корректный email.';
      return;
    }
    this.error = null;
    this.success = null;
    this.resendLoading = true;
    this.authApi.resendCode({ email }).subscribe({
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
}

