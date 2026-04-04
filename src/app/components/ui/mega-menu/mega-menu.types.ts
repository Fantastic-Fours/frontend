/** Icon id → rendered by {@link MegaMenuIconComponent} (Lucide-style inline SVGs). */
export type MegaMenuIconId =
  | 'calculator'
  | 'list'
  | 'building2'
  | 'home'
  | 'circle-plus'
  | 'sparkles'
  | 'newspaper'
  | 'info'
  | 'user'
  | 'layout'
  | 'search';

export interface MegaMenuSubItem {
  label: string;
  description: string;
  icon: MegaMenuIconId;
  routerLink: string;
}

export interface MegaMenuSubMenu {
  title: string;
  items: MegaMenuSubItem[];
}

export interface MegaMenuItem {
  id: number;
  label: string;
  subMenus?: MegaMenuSubMenu[];
  /** Simple top-level link (no dropdown). */
  routerLink?: string;
}
