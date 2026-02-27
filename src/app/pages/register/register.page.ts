import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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
      username: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password, password_confirm } = this.form.getRawValue();
    if (password !== password_confirm) {
      this.error = 'Пароли не совпадают.';
      return;
    }
    this.error = null;
    this.loading = true;
    this.authApi.register({ username, password, password_confirm }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.username?.[0]
          ?? err?.error?.password?.[0]
          ?? err?.error?.password_confirm?.[0]
          ?? err?.error?.detail
          ?? 'Ошибка регистрации. Попробуйте другой логин.';
        this.error = typeof msg === 'string' ? msg : String(msg);
      },
    });
  }
}
