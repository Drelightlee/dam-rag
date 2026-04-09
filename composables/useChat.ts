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
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder('utf-8')
      assistantMsg.loading = false
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // last element may be an incomplete line — save it for next chunk
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.chunks) {
              assistantMsg.sources = parsed.chunks
              continue
            }

            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) assistantMsg.content += delta
          } catch {
            // ignore parse errors
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
