// server/utils/retrieval.ts
import { Prisma } from '@prisma/client'
import db from './db'
import { getEmbedding } from './embeddings'

/**
 * 根据问题文本，在 pgvector 中检索最相似的 topK 个文本块
 * 使用余弦相似度（<=>操作符）
 */
export async function retrieveRelevantChunks(
  query: string,
  topK = 5,
): Promise<string[]> {
  const safeTopK = Math.max(1, Math.min(Math.floor(topK), 100))

  let queryEmbedding: number[]
  try {
    queryEmbedding = await getEmbedding(query)
  } catch {
    throw createError({ statusCode: 502, message: '向量化服务不可用' })
  }

  const vectorStr = `[${queryEmbedding.join(',')}]`

  try {
    const results = await db.$queryRaw<Array<{ content: string }>>`
      SELECT content
      FROM "Chunk"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${Prisma.raw(String(safeTopK))}
    `
    return results.map(r => r.content)
  } catch {
    throw createError({ statusCode: 500, message: '检索失败，请稍后重试' })
  }
}
