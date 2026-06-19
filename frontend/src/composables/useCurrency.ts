const formatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 2,
})

export const useCurrency = () => {
  const formatPrice = (value: number): string => formatter.format(value)

  return {
    formatPrice,
  }
}
