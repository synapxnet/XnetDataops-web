<script lang="ts" setup>
/**
 * OpenClaw智能助手浮窗组件
 * 可拖拽的悬浮窗口，点击展开聊天界面
 * 通过后端 SSE 代理与 Gateway 通信（避免 CORS 问题）
 */
import type { Assistant, AssistantConversation, AssistantMessage } from '#/views/XAA/api/types';

import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';

import {
  CloseOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  LoadingOutlined,
  MinusOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import { Avatar, Badge, Button, Input, Spin, Tooltip } from 'ant-design-vue';

import {
  addMessage,
  createConversation,
  fetchDefaultAssistant,
} from '#/views/XAA/api/assistant';

const { TextArea } = Input;

// Props
interface Props {
  assistantId?: number;
  visible?: boolean;
  position?: { right: number; bottom: number };
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  position: () => ({ right: 20, bottom: 20 }),
});

// Emit
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'minimize'): void;
}>();

// 状态
const loading = ref(true);
const expanded = ref(false);
const minimized = ref(false);
const fullscreen = ref(false);
const dragging = ref(false);

// 助手信息（使用完整 Assistant 类型，包含 id）
const assistant = ref<Assistant | null>(null);

// 会话和消息
const currentConversation = ref<AssistantConversation | null>(null);
const messages = ref<AssistantMessage[]>([]);

// 输入
const inputMessage = ref('');
const sending = ref(false);
const streamingContent = ref('');

// Gateway 连接状态（基于助手是否配置了 gatewayUrl）
const connected = ref(false);

// 图标位置（拖拽用）
const position = reactive({
  x: window.innerWidth - props.position.right - 60,
  y: window.innerHeight - props.position.bottom - 60,
});

// 展开后聊天框位置
const expandedPos = reactive({ x: 0, y: 0 });

// 消息容器引用
const messageContainerRef = ref<HTMLElement>();

// 解析 UI 配置
const uiConfig = computed(() => {
  if (!assistant.value?.uiConfig) return null;
  try {
    return typeof assistant.value.uiConfig === 'string'
      ? JSON.parse(assistant.value.uiConfig)
      : assistant.value.uiConfig;
  } catch {
    return null;
  }
});

// 计算展开后聊天框位置
const getExpandedPosition = () => {
  const config = uiConfig.value;
  const expandedWidth = config?.size?.width || 380;
  const expandedHeight = config?.size?.height || 500;
  const margin = 10;

  let ex = position.x;
  let ey = position.y;

  if (ex + expandedWidth > window.innerWidth) {
    ex = Math.max(margin, window.innerWidth - expandedWidth - margin);
  }
  if (ey + expandedHeight > window.innerHeight) {
    ey = Math.max(margin, window.innerHeight - expandedHeight - margin);
  }

  return { x: ex, y: ey };
};

// 计算样式
const floatingStyle = computed(() => {
  if (fullscreen.value) {
    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
    };
  }

  const config = uiConfig.value;
  const width = expanded.value ? (config?.size?.width || 380) : 60;
  const height = expanded.value ? (config?.size?.height || 500) : 60;
  const pos = expanded.value ? expandedPos : position;

  return {
    position: 'fixed' as const,
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${width}px`,
    height: minimized.value ? '50px' : `${height}px`,
    zIndex: 9999,
  };
});

// 主题色
const primaryColor = computed(() => {
  return uiConfig.value?.primaryColor || '#1890ff';
});

// 初始化
const initialize = async () => {
  loading.value = true;
  try {
    if (props.assistantId) {
      // 指定了 ID，直接获取助手详情
      const { fetchAssistant } = await import('#/views/XAA/api/assistant');
      assistant.value = await fetchAssistant(props.assistantId);
    } else {
      // 获取默认助手
      assistant.value = await fetchDefaultAssistant();
    }

    if (assistant.value) {
      connected.value = !!assistant.value.gatewayUrl;

      // 更新位置
      const config = uiConfig.value;
      if (config?.position) {
        position.x = window.innerWidth - config.position.right - 60;
        position.y = window.innerHeight - config.position.bottom - 60;
      }
    }
  } catch (error) {
    console.error('初始化助手失败:', error);
  } finally {
    loading.value = false;
  }
};

// 展开聊天窗口
const toggleExpand = async () => {
  expanded.value = !expanded.value;
  minimized.value = false;

  if (expanded.value) {
    const pos = getExpandedPosition();
    expandedPos.x = pos.x;
    expandedPos.y = pos.y;

    if (!currentConversation.value && assistant.value) {
      await createNewConversation();
    }
  }
};

// 创建新会话
const createNewConversation = async () => {
  if (!assistant.value) return;

  try {
    const conv = await createConversation(assistant.value.id, 'floating-user', 'User');
    currentConversation.value = conv;
    messages.value = [];
  } catch (error) {
    console.error('创建会话失败:', error);
  }
};

// 发送消息（通过后端 SSE 代理，与 chat.vue 相同）
const sendMessage = async () => {
  if (!inputMessage.value.trim() || sending.value || !assistant.value) return;

  if (!currentConversation.value) {
    await createNewConversation();
  }

  const content = inputMessage.value.trim();
  inputMessage.value = '';
  sending.value = true;

  // 添加用户消息到界面
  const userMsg: AssistantMessage = {
    id: Date.now(),
    uid: `MSG-${Date.now()}`,
    conversationId: currentConversation.value!.id,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };
  messages.value.push(userMsg);
  scrollToBottom();

  // 保存用户消息到后端
  try {
    await addMessage(currentConversation.value!.id, 'user', content);
  } catch (error) {
    console.error('保存消息失败:', error);
  }

  // 通过后端 SSE 代理发送到 Gateway
  await sendToGateway(content);
};

// SSE 流式请求（复用 chat.vue 的模式）
const sendToGateway = async (userContent: string) => {
  const chatMessages = messages.value.slice(-20).map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));

  try {
    const response = await fetch(`/xaa/assistants/${assistant.value!.id}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: chatMessages,
        stream: true,
        user: currentConversation.value?.uid || 'default',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gateway 返回 ${response.status}: ${errText}`);
    }

    // 读取 SSE 流式响应
    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder();
    let buffer = '';
    streamingContent.value = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            streamingContent.value += delta;
            scrollToBottom();
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    // 流式完成，保存完整回复
    if (streamingContent.value) {
      await saveAssistantMessage(streamingContent.value);
      streamingContent.value = '';
    }
  } catch (error: any) {
    console.error('Gateway 请求失败:', error);
    // 显示错误消息
    const errorMsg: AssistantMessage = {
      id: Date.now(),
      uid: `MSG-${Date.now()}`,
      conversationId: currentConversation.value?.id || 0,
      role: 'assistant',
      content: `抱歉，AI 回复失败: ${error.message || '未知错误'}`,
      createdAt: new Date().toISOString(),
    };
    messages.value.push(errorMsg);
    scrollToBottom();
  } finally {
    sending.value = false;
  }
};

// 保存助手消息
const saveAssistantMessage = async (content: string) => {
  if (!currentConversation.value) return;

  const msg: AssistantMessage = {
    id: Date.now(),
    uid: `MSG-${Date.now()}`,
    conversationId: currentConversation.value.id,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
  messages.value.push(msg);
  scrollToBottom();

  try {
    await addMessage(currentConversation.value.id, 'assistant', content);
  } catch (error) {
    console.error('保存助手消息失败:', error);
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
    }
  });
};

// 拖拽相关
let dragStartX = 0;
let dragStartY = 0;
let initialX = 0;
let initialY = 0;
let hasDragged = false;

const startDrag = (e: MouseEvent) => {
  if (expanded.value || fullscreen.value) return;

  dragStartX = e.clientX;
  dragStartY = e.clientY;
  initialX = position.x;
  initialY = position.y;
  hasDragged = false;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e: MouseEvent) => {
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;

  if (!hasDragged && Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;

  hasDragged = true;
  dragging.value = true;

  position.x = Math.max(0, Math.min(window.innerWidth - 60, initialX + deltaX));
  position.y = Math.max(0, Math.min(window.innerHeight - 60, initialY + deltaY));
};

const stopDrag = () => {
  dragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const handleIconClick = () => {
  if (hasDragged) return;
  toggleExpand();
};

// 键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 切换全屏
const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value;
};

// 最小化：收起为浮窗图标
const minimize = () => {
  expanded.value = false;
  fullscreen.value = false;
  minimized.value = false;
  emit('minimize');
};

// 关闭
const close = () => {
  expanded.value = false;
  emit('close');
};

onMounted(() => {
  initialize();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.visible"
      class="assistant-floating-window"
      :style="floatingStyle"
      :class="{
        'is-expanded': expanded,
        'is-fullscreen': fullscreen,
        'is-minimized': minimized,
        'is-dragging': dragging,
      }"
    >
      <!-- 收起状态：悬浮图标 -->
      <div
        v-if="!expanded"
        class="floating-icon"
        :style="{ backgroundColor: primaryColor }"
        @mousedown="startDrag"
        @click="handleIconClick"
      >
        <Spin v-if="loading" :indicator="h(LoadingOutlined, { style: { fontSize: '24px', color: '#fff' } })" />
        <Badge v-else :dot="connected" :offset="[-5, 5]" status="success">
          <Avatar
            v-if="assistant?.avatar"
            :size="48"
            :src="assistant.avatar"
          />
          <RobotOutlined v-else class="text-2xl text-white" />
        </Badge>
      </div>

      <!-- 展开状态：聊天窗口 -->
      <div v-else class="chat-window">
        <!-- 头部 -->
        <div
          class="chat-header"
          :style="{ backgroundColor: primaryColor }"
        >
          <div class="flex items-center gap-2">
            <Avatar
              :size="32"
              :src="assistant?.avatar"
              class="bg-white/20"
            >
              {{ assistant?.name?.charAt(0) }}
            </Avatar>
            <div>
              <div class="font-semibold text-white">
                {{ assistant?.name || '智能助手' }}
              </div>
              <div class="text-xs text-white/70">
                {{ connected ? '已连接' : '未配置' }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <Tooltip title="最小化">
              <Button type="text" size="small" class="text-white" @click="minimize">
                <MinusOutlined />
              </Button>
            </Tooltip>
            <Tooltip :title="fullscreen ? '退出全屏' : '全屏'">
              <Button type="text" size="small" class="text-white" @click="toggleFullscreen">
                <FullscreenExitOutlined v-if="fullscreen" />
                <FullscreenOutlined v-else />
              </Button>
            </Tooltip>
            <Tooltip title="收起">
              <Button type="text" size="small" class="text-white" @click="toggleExpand">
                <CloseOutlined />
              </Button>
            </Tooltip>
          </div>
        </div>

        <!-- 消息区域 -->
        <div ref="messageContainerRef" class="chat-messages">
          <!-- 欢迎消息 -->
          <div v-if="messages.length === 0 && !assistant" class="welcome-message">
            <RobotOutlined class="empty-assistant-icon" />
            <p class="text-muted-foreground mt-2">未找到默认助手，请先在智能助手页面设置一个默认助手</p>
          </div>
          <div v-else-if="messages.length === 0" class="welcome-message">
            <Avatar :size="48" class="mb-2" :style="{ backgroundColor: primaryColor }">
              <RobotOutlined />
            </Avatar>
            <p class="text-muted-foreground">
              {{ assistant?.welcomeMessage || '你好！我是你的AI助手，有什么可以帮助你的吗？' }}
            </p>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'is-user': msg.role === 'user' }"
          >
            <Avatar
              :size="28"
              :class="msg.role === 'user' ? 'bg-green-500' : ''"
              :style="msg.role !== 'user' ? { backgroundColor: primaryColor } : {}"
            >
              <UserOutlined v-if="msg.role === 'user'" />
              <RobotOutlined v-else />
            </Avatar>
            <div
              class="message-content"
              :style="msg.role === 'user' ? { backgroundColor: primaryColor } : {}"
            >
              {{ msg.content }}
              <div class="message-time">{{ formatTime(msg.createdAt) }}</div>
            </div>
          </div>

          <!-- 流式响应 -->
          <div v-if="streamingContent" class="message-item">
            <Avatar :size="28" :style="{ backgroundColor: primaryColor }">
              <RobotOutlined />
            </Avatar>
            <div class="message-content">
              {{ streamingContent }}
              <div class="message-time">
                <LoadingOutlined /> 输入中...
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="sending && !streamingContent" class="message-item">
            <Avatar :size="28" :style="{ backgroundColor: primaryColor }">
              <RobotOutlined />
            </Avatar>
            <div class="message-content">
              <LoadingOutlined /> 思考中...
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <TextArea
            v-model:value="inputMessage"
            :placeholder="assistant?.placeholder || '输入消息...'"
            :auto-size="{ minRows: 1, maxRows: 3 }"
            :disabled="sending || !assistant"
            @keydown="handleKeydown"
          />
          <Button
            type="primary"
            :style="{ backgroundColor: primaryColor, borderColor: primaryColor }"
            :loading="sending"
            :disabled="!inputMessage.trim() || !assistant"
            @click="sendMessage"
          >
            <SendOutlined />
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { h } from 'vue';
export default {
  name: 'AssistantFloatingWindow',
};
</script>

<style scoped>
.assistant-floating-window {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.3s ease;
}

.assistant-floating-window.is-dragging {
  transition: none;
}

/* 悬浮图标 */
.floating-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.floating-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* 聊天窗口 */
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: hsl(var(--card-foreground));
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.is-fullscreen .chat-window {
  border-radius: 0;
}

.is-minimized .chat-window {
  height: 50px;
}

/* 头部 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  color: #fff;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: hsl(var(--muted) / 35%);
}

.is-minimized .chat-messages {
  display: none;
}

.welcome-message {
  text-align: center;
  padding: 32px 16px;
}

.empty-assistant-icon {
  font-size: 48px;
  color: hsl(var(--muted-foreground));
}

.message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.message-item.is-user {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  color: hsl(var(--card-foreground));
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-item.is-user .message-content {
  color: #fff;
  border-color: transparent;
  box-shadow: none;
}

.message-time {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.6;
}

/* 输入区域 */
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid hsl(var(--border));
  background: hsl(var(--card));
}

.is-minimized .chat-input {
  display: none;
}

.chat-input :deep(.ant-input) {
  border-radius: 20px;
  padding: 8px 16px;
}

.chat-input :deep(.ant-btn) {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
}
</style>
