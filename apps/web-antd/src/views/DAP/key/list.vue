<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, Form, FormItem, Input, DatePicker, Textarea, message } from 'ant-design-vue';
import { getKeys, createKey, revokeKey, deleteKey } from '../api/apiConfig';
import type { ApiKey } from '../api/types';

const loading = ref(false);
const dataList = ref<ApiKey[]>([]);

const columns = [
  { title: '应用名称', dataIndex: 'appName', key: 'appName' },
  { title: 'API Key', dataIndex: 'apiKey', key: 'apiKey' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '过期时间', dataIndex: 'expireAt', key: 'expireAt', width: 180 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  active: 'green',
  revoked: 'red',
  expired: 'default',
};

const statusLabelMap: Record<string, string> = {
  active: '有效',
  revoked: '已吊销',
  expired: '已过期',
};

function maskKey(key: string) {
  if (!key || key.length <= 8) return key;
  return key.slice(0, 4) + '****' + key.slice(-4);
}

const modalVisible = ref(false);
const formState = reactive({
  appName: '',
  permissions: '',
  expireAt: '',
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getKeys();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取密钥列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  Object.assign(formState, { appName: '', permissions: '', expireAt: '' });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.appName) {
    message.error('应用名称不能为空');
    return;
  }
  try {
    await createKey({ ...formState });
    message.success('创建成功');
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  }
}

function handleRevoke(record: ApiKey) {
  Modal.confirm({
    title: '确认吊销',
    content: `确定要吊销密钥「${record.appName}」吗？吊销后将无法使用。`,
    okType: 'danger',
    async onOk() {
      try {
        await revokeKey(record.id);
        message.success('吊销成功');
        fetchList();
      } catch (e: any) {
        message.error('吊销失败: ' + e.message);
      }
    },
  });
}

function handleDelete(record: ApiKey) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除密钥「${record.appName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteKey(record.id);
        message.success('删除成功');
        fetchList();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="API密钥管理">
      <template #extra>
        <Button type="primary" @click="showCreate">创建密钥</Button>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'apiKey'">
            <span style="font-family: monospace;">{{ maskKey((_record as any).apiKey) }}</span>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ statusLabelMap[(_record as any).status] || (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleRevoke(_record as ApiKey)" :disabled="(_record as any).status !== 'active'">吊销</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as ApiKey)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="modalVisible" title="创建密钥" @ok="handleSubmit" :destroy-on-close="true" width="500px">
      <Form layout="vertical">
        <FormItem label="应用名称" required>
          <Input v-model:value="formState.appName" placeholder="请输入应用名称" />
        </FormItem>
        <FormItem label="权限 (JSON)">
          <Textarea v-model:value="formState.permissions" :rows="3" placeholder='["read","write"]' style="font-family: monospace;" />
        </FormItem>
        <FormItem label="过期时间">
          <DatePicker v-model:value="formState.expireAt" show-time placeholder="选择过期时间" style="width: 100%;" value-format="YYYY-MM-DD HH:mm:ss" />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
