<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Form, FormItem, Input, Select, SelectOption, Button, Textarea, Space, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { createSyncTask } from '../api/syncTask';

const router = useRouter();

const formState = reactive({
  name: '',
  sourceDsId: undefined as number | undefined,
  targetDsId: undefined as number | undefined,
  sourceTable: '',
  targetTable: '',
  syncMode: 'full',
  incrementalField: '',
  scheduleCron: '',
  description: '',
});

async function handleSubmit() {
  if (!formState.name || !formState.sourceTable || !formState.targetTable) {
    message.error('任务名称、源表和目标表不能为空');
    return;
  }
  try {
    await createSyncTask({ ...formState });
    message.success('创建成功');
    router.push('/DIM/task/list');
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  }
}

onMounted(() => {});
</script>

<template>
  <div class="p-4">
    <Card title="创建同步任务">
      <Form layout="vertical" style="max-width: 600px;">
        <FormItem label="任务名称" required>
          <Input v-model:value="formState.name" placeholder="请输入任务名称" />
        </FormItem>
        <FormItem label="同步模式">
          <Select v-model:value="formState.syncMode">
            <SelectOption value="full">全量同步</SelectOption>
            <SelectOption value="incremental">增量同步</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="源表" required>
          <Input v-model:value="formState.sourceTable" placeholder="源数据表名" />
        </FormItem>
        <FormItem label="目标表" required>
          <Input v-model:value="formState.targetTable" placeholder="目标数据表名" />
        </FormItem>
        <FormItem label="增量字段" v-if="formState.syncMode === 'incremental'">
          <Input v-model:value="formState.incrementalField" placeholder="增量字段名" />
        </FormItem>
        <FormItem label="Cron 表达式">
          <Input v-model:value="formState.scheduleCron" placeholder="例如: 0 0 2 * * ?" />
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="formState.description" :rows="2" placeholder="任务描述" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSubmit">创建</Button>
            <Button @click="router.back()">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
