export const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(amount) || 0);
};

export const formatDate = (dateString: string | Date) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'short', 
  });
};

export const formatThousands = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || val === '') return '';
  const clean = String(val).replace(/[^0-9]/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
};

export const parseThousands = (val: string | number | undefined | null): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9]/g, '');
  return clean ? Number(clean) : 0;
};
