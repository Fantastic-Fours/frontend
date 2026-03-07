import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from '../constants/api.constants';
import type { AIChatRequest, AIChatResponse } from '../interfaces/ai-consultant.types';

@Injectable({ providedIn: 'root' })
export class AIConsultantApiService {
  private readonly base = API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  /** POST /api/ai-consultant/chat/ — send message and get AI reply with suggestions. */
  chat(payload: AIChatRequest): Observable<AIChatResponse> {
    return this.http.post<AIChatResponse>(
      `${this.base}${API_PATHS.aiConsultant.chat}`,
      payload
    );
  }
}
