// server/utils/retrieval.ts
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
  const queryEmbedding = await getEmbedding(query)
  const vectorStr = `[${queryEmbedding.join(',')}]`

  const results = await db.$queryRaw<Array<{ content: string }>>`
    SELECT content
    FROM "Chunk"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `

  return results.map(r => r.content)
}
