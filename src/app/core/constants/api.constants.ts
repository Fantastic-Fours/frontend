export const API_BASE_URL = '/api';

export const API_PATHS = {
  auth: {
    token: '/auth/token/',
    refresh: '/auth/token/refresh/',
    register: '/auth/register/',
  },
  mortgage: {
    match: '/mortgage/match/',
    programs: '/mortgage/programs/',
    programDetail: (id: number) => `/mortgage/programs/${id}/`,
    apartments: '/mortgage/apartments/',
    apartmentDetail: (id: number) => `/mortgage/apartments/${id}/`,
    news: '/mortgage/news/',
    newsDetail: (id: number) => `/mortgage/news/${id}/`,
  },
} as const;
