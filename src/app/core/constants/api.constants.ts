export const API_BASE_URL = '/api';

export const API_PATHS = {
  auth: {
    token: '/auth/token/',
    refresh: '/auth/token/refresh/',
  },
  mortgage: {
    match: '/mortgage/match/',
    programs: '/mortgage/programs/',
    programDetail: (id: number) => `/mortgage/programs/${id}/`,
    apartments: '/mortgage/apartments/',
    apartmentDetail: (id: number) => `/mortgage/apartments/${id}/`,
  },
} as const;
