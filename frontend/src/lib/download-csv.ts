export function downloadCsv(csv: string): void {
  // El BOM permite que Excel reconozca UTF-8 al abrir directamente el archivo.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = 'lista-compras.csv'
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(url)
  }
}
