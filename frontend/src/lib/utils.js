export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (num) => new Intl.NumberFormat('en-LK').format(num || 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const today = () => new Date().toISOString().slice(0, 10);

export const generateBarcodeNumber = () => {
  return 'LK-' + Date.now().toString().slice(-8);
};
