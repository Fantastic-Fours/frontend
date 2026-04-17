import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { invalidJwtRetryInterceptor } from './core/interceptors/invalid-jwt-retry.interceptor';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

const APP_LANGS = ['ru', 'kk', 'en'] as const;
const STORAGE_KEY = 'appLang';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor, invalidJwtRetryInterceptor])),
    ...provideTranslateService({
      fallbackLang: 'ru',
      lang: 'ru',
    }),
    ...provideTranslateHttpLoader({
      prefix: '/assets/i18n/',
      suffix: '.json',
    }),
    provideAppInitializer(async () => {
      const translate = inject(TranslateService);
      translate.addLangs([...APP_LANGS]);
      let lang = 'ru';
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && APP_LANGS.includes(stored as (typeof APP_LANGS)[number])) {
          lang = stored;
        }
      }
      await firstValueFrom(translate.use(lang));
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    }),
  ],
};
