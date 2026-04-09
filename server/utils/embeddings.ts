// server/utils/embeddings.ts

interface EmbeddingResponse {
  output: {
    embeddings: Array<{ embedding: number[] }>
  }
}

/**
 * 调用通义千问 text-embedding-v2 获取文本向量
 * 维度：1536
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = useRuntimeConfig().dashscopeApiKey

  const response = await $fetch<EmbeddingResponse>(
    'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: 'text-embedding-v2',
        input: { texts: [text] },
      },
    },
  )

  const first = response.output.embeddings[0]
  if (!first) throw new Error('DashScope returned no embeddings')
  return first.embedding
}
