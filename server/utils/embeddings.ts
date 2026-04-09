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

  let response: EmbeddingResponse
  try {
    response = await $fetch<EmbeddingResponse>(
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
  } catch {
    throw createError({ statusCode: 502, message: 'Embedding 服务不可用' })
  }

  const first = response.output.embeddings[0]
  if (!first) throw createError({ statusCode: 502, message: 'Embedding 返回为空' })

  if (first.embedding.length !== 1536) {
    throw createError({
      statusCode: 502,
      message: `向量维度不匹配：期望 1536，实际 ${first.embedding.length}`,
    })
  }

  return first.embedding
}
