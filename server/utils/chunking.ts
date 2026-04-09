// server/utils/chunking.ts

/**
 * 将长文本按 chunkSize 字符分块，相邻块之间有 overlap 字符重叠
 * 避免语义在块边界被截断
 */
export function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 50,
): string[] {
  if (overlap >= chunkSize)
    throw new Error(`overlap (${overlap}) must be less than chunkSize (${chunkSize})`)

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start = end - overlap
    if (start >= text.length) break
  }

  return chunks.filter(c => c.trim().length > 0)
}
