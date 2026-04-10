export const API_BASE_URL = '/api';

export const API_PATHS = {
  auth: {
    token: '/auth/token/',
    refresh: '/auth/token/refresh/',
    register: '/auth/register/',
    verifyCode: '/auth/verify-code/',
    resendCode: '/auth/resend-code/',
    forgotPassword: '/auth/forgot-password/',
    resetPassword: '/auth/reset-password/',
    resendResetCode: '/auth/resend-reset-code/',
  },
  mortgage: {
    recommend: '/recommend-mortgage/',
    match: '/mortgage/match/',
    predict: '/mortgage/predict/',
    programs: '/mortgage/programs/',
    programDetail: (id: number) => `/mortgage/programs/${id}/`,
    banks: '/mortgage/banks/',
    bankDetail: (id: number) => `/mortgage/banks/${id}/`,
    apartments: '/mortgage/apartments/',
    apartmentDetail: (id: number) => `/mortgage/apartments/${id}/`,
    predictPrice: '/predict-price/',
    propertyPriceAnalysis: (id: number) => `/property/${id}/analysis/`,
    news: '/mortgage/news/',
    newsDetail: (id: number) => `/mortgage/news/${id}/`,
  },
  users: {
    me: '/users/me/',
    savedApartments: '/users/me/saved-apartments/',
    savedApartmentDetail: (id: number) => `/users/me/saved-apartments/${id}/`,
    calculationHistory: '/users/me/calculation-history/',
    myListings: '/users/me/my-listings/',
  },
  aiConsultant: {
    chat: '/ai-consultant/chat/',
  },
} as const;
