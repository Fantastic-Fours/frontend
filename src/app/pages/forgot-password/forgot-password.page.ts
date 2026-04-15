import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
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
    private router: Router,
    private translate: TranslateService
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
        this.success = res.detail ?? this.translate.instant('forgotMsg.codeSent');
        this.resetForm.patchValue({ email });
        this.step = 'reset';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.detail ?? this.translate.instant('verify.errResend');
      },
    });
  }

  resend(): void {
    const email = this.resetForm.get('email')?.value;
    if (!email || this.resetForm.get('email')?.invalid) {
      this.resetForm.get('email')?.markAsTouched();
      this.error = this.translate.instant('forgot.errEmail');
      return;
    }
    this.error = null;
    this.success = null;
    this.resendLoading = true;
    this.authApi.resendResetCode({ email }).subscribe({
      next: (res) => {
        this.resendLoading = false;
        this.success = res.detail ?? this.translate.instant('verify.codeSent');
      },
      error: (err) => {
        this.resendLoading = false;
        this.error = err?.error?.detail ?? this.translate.instant('verify.errResend');
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
      this.error = this.translate.instant('forgot.errMismatch');
      return;
    }
    this.error = null;
    this.success = null;
    this.loading = true;
    this.authApi.resetPassword(raw).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.detail ?? this.translate.instant('forgotMsg.passwordUpdated');
        setTimeout(() => this.router.navigate(['/login']), 800);
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err?.error?.password?.[0] ??
          err?.error?.password_confirm?.[0] ??
          err?.error?.detail ??
          this.translate.instant('forgot.errUpdate');
        this.error = typeof msg === 'string' ? msg : String(msg);
      },
    });
  }
}

