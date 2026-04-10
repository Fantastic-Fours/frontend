/** Человекочитаемые подписи для кодов льгот (совпадают с backend UserPrivilege). */
const LABELS: Record<string, string> = {
  veteran_ww2: 'Ветеран ВОВ',
  veteran_equivalent: 'Приравненный к ветерану ВОВ',
  combat_veteran: 'Ветеран боевых действий',
  disabled_group_1: 'Инвалид I группы',
  disabled_group_2: 'Инвалид II группы',
  family_with_disabled_child: 'Семья с ребенком-инвалидом',
  widow: 'Вдова',
  large_family: 'Многодетная семья',
  orphan: 'Сирота',
};

export function formatPrivilegeLabels(codes?: string[] | null): string {
  if (!codes?.length) {
    return '';
  }
  return codes.map((c) => LABELS[c] ?? c).join(', ');
}
