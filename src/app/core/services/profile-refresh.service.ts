import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Сигнал для родительского layout профиля перезагрузить данные пользователя. */
@Injectable({ providedIn: 'root' })
export class ProfileRefreshService {
  private readonly bus = new Subject<void>();
  readonly refresh$ = this.bus.asObservable();

  notify(): void {
    this.bus.next();
  }
}
