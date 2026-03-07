/** Map bank name (from API) to logo asset path. Returns null if no logo. */
export function getBankLogoPath(bankName: string | undefined): string | null {
  if (!bankName || typeof bankName !== 'string') return null;
  const key = bankName.toLowerCase().replace(/\s+/g, ' ').trim();
  if (key.includes('altyn')) return 'assets/bank_logos/altyn_bank.png';
  if (key.includes('rbk')) return 'assets/bank_logos/bank_RBK.png';
  if (key.includes('halyk')) return 'assets/bank_logos/halyk.webp';
  if (key.includes('nurbank')) return 'assets/bank_logos/nurbank.jpg';
  return null;
}
