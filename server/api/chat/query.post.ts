// server/api/chat/query.post.ts
import { retrieveRelevantChunks } from '~/server/utils/retrieval'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface QueryBody {
  question: string
  history?: ChatMessage[]
}

export default defineEventHandler(async (event) => {
  const { question, history = [] } = await readBody<QueryBody>(event)

  if (!question?.trim()) {
    throw createError({ statusCode: 400, message: '问题不能为空' })
  }

  // 检索相关文档块
  const relevantChunks = await retrieveRelevantChunks(question, 5)
  const context = relevantChunks.join('\n\n---\n\n')

  const systemPrompt = `你是一个知识库助手。请根据以下参考资料回答用户问题。
如果参考资料中没有相关信息，请如实告知。
回答时请引用具体内容（用"根据文档..."开头）。

参考资料：
${context}`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6), // 保留最近6条历史
    { role: 'user', content: question },
  ]

  const apiKey = useRuntimeConfig().dashscopeApiKey

  // 设置 SSE 响应头
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // 调用通义千问流式接口（OpenAI 兼容模式）
  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages,
          stream: true,
        }),
      },
    )
  } catch {
    throw createError({ statusCode: 502, message: 'AI 服务不可用' })
  }

  if (!upstreamResponse.ok) {
    throw createError({ statusCode: 502, message: `AI 服务返回错误: ${upstreamResponse.status}` })
  }

  // 将上游 SSE 流转发给客户端
  const reader = upstreamResponse.body!.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      await event.node.res.write(chunk)
    }
  } finally {
    // 追加引用来源（自定义事件，供前端解析）
    const sourceEvent = `\ndata: ${JSON.stringify({
      type: 'sources',
      chunks: relevantChunks.map((c, i) => ({
        index: i + 1,
        preview: c.slice(0, 100) + (c.length > 100 ? '...' : ''),
      })),
    })}\n\n`
    await event.node.res.write(sourceEvent)
    event.node.res.end()
  }
})
