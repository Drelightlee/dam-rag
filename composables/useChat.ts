// composables/useChat.ts

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ index: number; preview: string }>
  loading?: boolean
}

export function useChat() {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)

  async function sendMessage(question: string) {
    if (isStreaming.value || !question.trim()) return

    messages.value.push({ role: 'user', content: question })

    const assistantMsg: Message = { role: 'assistant', content: '', loading: true }
    messages.value.push(assistantMsg)
    isStreaming.value = true

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          history: messages.value.slice(-8, -2).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        assistantMsg.content = '请求失败，请稍后重试'
        assistantMsg.loading = false
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder('utf-8')
      assistantMsg.loading = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)

            // 自定义 sources 事件（server sends event: sources\ndata: {"chunks":[...]}\n\n）
            if (parsed.chunks) {
              assistantMsg.sources = parsed.chunks
              continue
            }

            // OpenAI delta 格式
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) assistantMsg.content += delta
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch {
      assistantMsg.content = '网络错误，请稍后重试'
    } finally {
      isStreaming.value = false
      assistantMsg.loading = false
    }
  }

  function clearHistory() {
    messages.value = []
  }

  return { messages, isStreaming, sendMessage, clearHistory }
}
