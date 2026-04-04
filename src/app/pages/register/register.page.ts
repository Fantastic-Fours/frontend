import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { WaveTextComponent } from '../../components/ui';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, WaveTextComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  form: FormGroup;
  error: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authApi: AuthApiService,
    private router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, password_confirm } = this.form.getRawValue();
    if (password !== password_confirm) {
      this.error = 'Пароли не совпадают.';
      return;
    }
    this.error = null;
    this.loading = true;
    this.authApi.register({ email, password, password_confirm }).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/verify-email'], { queryParams: { email: res.email } });
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.email?.[0]
          ?? err?.error?.password?.[0]
          ?? err?.error?.password_confirm?.[0]
          ?? err?.error?.detail
          ?? 'Ошибка регистрации. Попробуйте другой email.';
        this.error = typeof msg === 'string' ? msg : String(msg);
      },
    });
  }
}
