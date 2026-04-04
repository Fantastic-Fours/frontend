import type { MegaMenuItem } from './components/ui/mega-menu/mega-menu.types';

/** Primary navigation for {@link MegaMenuComponent} — iDom routes & copy. */
export const PRIMARY_NAV_ITEMS: MegaMenuItem[] = [
  { id: 1, label: 'О нас', routerLink: '/about' },
  {
    id: 2,
    label: 'Ипотека',
    subMenus: [
      {
        title: 'Сервисы',
        items: [
          {
            label: 'Подбор',
            description: 'Программы под ваш доход, взнос и срок',
            icon: 'calculator',
            routerLink: '/match',
          },
          {
            label: 'Программы',
            description: 'Каталог ипотечных предложений банков',
            icon: 'list',
            routerLink: '/programs',
          },
        ],
      },
    ],
  },
  { id: 3, label: 'AI-консультант', routerLink: '/ai-consultant' },
  { id: 4, label: 'Новости', routerLink: '/news' },
  {
    id: 5,
    label: 'Недвижимость',
    subMenus: [
      {
        title: 'Каталог',
        items: [
          {
            label: 'Первичка',
            description: 'Новостройки и жилые комплексы',
            icon: 'building2',
            routerLink: '/estate/primary',
          },
          {
            label: 'Вторичка',
            description: 'Квартиры на вторичном рынке',
            icon: 'home',
            routerLink: '/estate/secondary',
          },
        ],
      },
      {
        title: 'Размещение',
        items: [
          {
            label: 'Подать объявление',
            description: 'Добавить объект в каталог',
            icon: 'circle-plus',
            routerLink: '/estate/submit',
          },
        ],
      },
    ],
  },
];
