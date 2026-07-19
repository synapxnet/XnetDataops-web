<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Button, Space, Textarea, Table, message } from 'ant-design-vue';
import { recordQueryHistory } from './api/sqlScript';

const sqlContent = ref('SELECT 1;');
const results = ref<any[]>([]);
const resultColumns = ref<any[]>([]);
const executing = ref(false);

async function handleExecute() {
  if (!sqlContent.value.trim()) {
    message.warning('请输入SQL语句');
    return;
  }
  executing.value = true;
  try {
    // Record to history
    await recordQueryHistory({
      sqlContent: sqlContent.value,
      executeStatus: 'success',
      rowsAffected: 0,
      durationMs: 0,
    });
    message.success('SQL已记录到历史（实际执行需连接数据源）');
    results.value = [];
    resultColumns.value = [];
  } catch (e: any) {
    message.error('执行失败: ' + e.message);
  } finally {
    executing.value = false;
  }
}
</script>

<template>
  <div class="p-4">
    <Card title="SQL 工作台">
      <div style="margin-bottom: 12px;">
        <Textarea v-model:value="sqlContent" :rows="8" placeholder="请输入SQL语句..." style="font-family: monospace; font-size: 14px;" />
      </div>
      <Space style="margin-bottom: 12px;">
        <Button type="primary" :loading="executing" @click="handleExecute">执行</Button>
        <Button @click="sqlContent = ''">清空</Button>
      </Space>
      <Card v-if="resultColumns.length > 0" title="查询结果" size="small">
        <Table :columns="resultColumns" :data-source="results" size="small" :scroll="{ x: true }" />
      </Card>
      <div v-else style="color: #999; text-align: center; padding: 40px 0;">
        执行SQL查看结果
      </div>
    </Card>
  </div>
</template>
