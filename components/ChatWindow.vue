<!-- components/ChatWindow.vue -->
<script setup lang="ts">
const { messages, isStreaming, sendMessage, clearHistory } = useChat()
const input = ref('')
const messagesEl = ref<HTMLElement>()

async function handleSend() {
  const q = input.value.trim()
  if (!q || isStreaming.value) return
  input.value = ''
  await sendMessage(q)
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表 -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div v-if="!messages.length" class="text-center text-gray-400 mt-20">
        上传文件后，在这里提问
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
      >
        <div
          class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
          :class="msg.role === 'user'
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'"
        >
          <!-- loading 动画 -->
          <div v-if="msg.loading" class="flex gap-1 items-center py-1">
            <span
              v-for="j in 3"
              :key="j"
              class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              :style="{ animationDelay: `${(j - 1) * 0.15}s` }"
            />
          </div>
          <div v-else>
            <p class="whitespace-pre-wrap">{{ msg.content }}</p>
            <!-- 引用来源 -->
            <div v-if="msg.sources?.length" class="mt-2 pt-2 border-t border-gray-200">
              <p class="text-xs text-gray-500 font-medium mb-1">参考来源</p>
              <p
                v-for="src in msg.sources"
                :key="src.index"
                class="text-xs text-gray-400 leading-relaxed"
              >
                {{ src.index }}. {{ src.preview }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="border-t border-gray-200 px-4 py-3 flex gap-2">
      <textarea
        v-model="input"
        rows="1"
        placeholder="输入问题，Enter 发送，Shift+Enter 换行"
        class="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keydown="handleKeydown"
      />
      <button
        :disabled="isStreaming || !input.trim()"
        class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        @click="handleSend"
      >
        发送
      </button>
    </div>
  </div>
</template>
