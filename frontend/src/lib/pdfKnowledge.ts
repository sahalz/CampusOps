import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

type PdfJsTextItem = {
  str: string
  transform: number[]
}

type PositionedText = {
  text: string
  x: number
  y: number
}

export type KnowledgePdfPage = {
  pageNumber: number
  text: string
}

export type KnowledgePdfResult = {
  pages: KnowledgePdfPage[]
  pageCount: number
  wordCount: number
}

function isTextItem(value: unknown): value is PdfJsTextItem {
  return Boolean(value && typeof value === 'object' && 'str' in value && 'transform' in value)
}

function pageText(items: PositionedText[]) {
  const lines: Array<{ y: number; items: PositionedText[] }> = []
  items
    .sort((first, second) => second.y - first.y || first.x - second.x)
    .forEach((item) => {
      const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= 3.5)
      if (line) {
        line.items.push(item)
        line.y = (line.y + item.y) / 2
      } else {
        lines.push({ y: item.y, items: [item] })
      }
    })

  return lines
    .sort((first, second) => second.y - first.y)
    .map((line) => line.items
      .sort((first, second) => first.x - second.x)
      .map((item) => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean)
    .join('\n')
}

export async function extractKnowledgePdf(data: Uint8Array): Promise<KnowledgePdfResult> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const document = await getDocument({ data }).promise
  const pages: KnowledgePdfPage[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = pageText(content.items.flatMap<PositionedText>((item) => isTextItem(item)
      ? [{ text: item.str.replace(/\s+/g, ' ').trim(), x: item.transform[4], y: item.transform[5] }]
      : []).filter((item) => item.text.length > 0))
    if (text) {
      pages.push({ pageNumber, text })
    }
  }

  if (pages.length === 0) {
    throw new Error('This PDF has no selectable policy text. Run OCR first or upload a text-based PDF.')
  }

  return {
    pages,
    pageCount: document.numPages,
    wordCount: pages.reduce((total, page) => total + page.text.split(/\s+/).filter(Boolean).length, 0),
  }
}
