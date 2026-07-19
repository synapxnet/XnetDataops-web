<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Form, FormItem, Input, InputNumber, Select, SelectOption, Button, Textarea, Space, message } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { createConfig, updateConfig, getConfig } from '../api/apiConfig';

const router = useRouter();
const route = useRoute();
const editId = ref<number | null>(null);

const formState = reactive({
  name: '',
  path: '',
  method: 'GET',
  datasourceId: undefined as number | undefined,
  sqlContent: '',
  paramConfig: '',
  rateLimit: 60,
  cacheTtl: 0,
  description: '',
});

async function handleSubmit() {
  if (!formState.name || !formState.path) {
    message.error('API名称和路径不能为空');
    return;
  }
  try {
    if (editId.value) {
      await updateConfig(editId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createConfig({ ...formState });
      message.success('创建成功');
    }
    router.push('/DAP/config/list');
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

onMounted(async () => {
  const id = route.query.id;
  if (id) {
    editId.value = Number(id);
    try {
      const config = await getConfig(editId.value);
      Object.assign(formState, config);
    } catch (e: any) {
      message.error('获取API配置详情失败');
    }
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="editId ? '编辑API配置' : '新建API配置'">
      <Form layout="vertical" style="max-width: 600px;">
        <FormItem label="API名称" required>
          <Input v-model:value="formState.name" placeholder="请输入API名称" />
        </FormItem>
        <FormItem label="请求路径" required>
          <Input v-model:value="formState.path" placeholder="例如: /api/v1/users" />
        </FormItem>
        <FormItem label="请求方法">
          <Select v-model:value="formState.method">
            <SelectOption value="GET">GET</SelectOption>
            <SelectOption value="POST">POST</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="数据源ID">
          <InputNumber v-model:value="formState.datasourceId" :min="1" style="width: 100%;" placeholder="关联的数据源ID" />
        </FormItem>
        <FormItem label="SQL内容">
          <Textarea v-model:value="formState.sqlContent" :rows="6" placeholder="SELECT * FROM table WHERE id = :id" style="font-family: monospace;" />
        </FormItem>
        <FormItem label="参数配置 (JSON)">
          <Textarea v-model:value="formState.paramConfig" :rows="4" placeholder='[{"name":"id","type":"int","required":true}]' style="font-family: monospace;" />
        </FormItem>
        <FormItem label="限流 (次/分钟)">
          <InputNumber v-model:value="formState.rateLimit" :min="0" style="width: 100%;" />
        </FormItem>
        <FormItem label="缓存TTL (秒)">
          <InputNumber v-model:value="formState.cacheTtl" :min="0" style="width: 100%;" />
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="formState.description" :rows="2" placeholder="API描述" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSubmit">{{ editId ? '更新' : '创建' }}</Button>
            <Button @click="router.back()">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
