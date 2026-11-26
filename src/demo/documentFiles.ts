const demoFiles: Record<string, string> = {
  d1: 'life-guide.pdf',
  d2: 'travel-expense.pdf',
  d3: 'security-rules.pdf',
  d4: 'operations-guide.pdf',
}

export function demoDocumentFileUrl(documentId: string, page = 1) {
  return `${import.meta.env.BASE_URL}demo-docs/${demoFiles[documentId] ?? ''}#page=${page}&navpanes=0`
}
