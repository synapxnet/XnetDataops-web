<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getConfigs, deleteConfig, publishConfig, deprecateConfig } from '../api/apiConfig';
import type { ApiConfig } from '../api/types';

const router = useRouter();
const loading = ref(false);
const dataList = ref<ApiConfig[]>([]);

const columns = [
  { title: 'API名称', dataIndex: 'name', key: 'name' },
  { title: '路径', dataIndex: 'path', key: 'path' },
  { title: '方法', dataIndex: 'method', key: 'method', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '限流(次/分)', dataIndex: 'rateLimit', key: 'rateLimit', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
];

const methodColorMap: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
};

const statusColorMap: Record<string, string> = {
  draft: 'default',
  published: 'green',
  deprecated: 'red',
};

const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  deprecated: '已废弃',
};

async function fetchList() {
  loading.value = true;
  try {
    const res = await getConfigs();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取API配置列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handlePublish(record: ApiConfig) {
  Modal.confirm({
    title: '确认发布',
    content: `确定要发布API「${record.name}」吗？`,
    async onOk() {
      try {
        await publishConfig(record.id);
        message.success('发布成功');
        fetchList();
      } catch (e: any) {
        message.error('发布失败: ' + e.message);
      }
    },
  });
}

function handleDeprecate(record: ApiConfig) {
  Modal.confirm({
    title: '确认废弃',
    content: `确定要废弃API「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deprecateConfig(record.id);
        message.success('废弃成功');
        fetchList();
      } catch (e: any) {
        message.error('废弃失败: ' + e.message);
      }
    },
  });
}

function handleDelete(record: ApiConfig) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除API「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteConfig(record.id);
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
    <Card title="API配置列表">
      <template #extra>
        <Button type="primary" @click="router.push('/DAP/config/create')">新建API</Button>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'method'">
            <Tag :color="methodColorMap[(_record as any).method] || 'default'">{{ (_record as any).method }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ statusLabelMap[(_record as any).status] || (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="router.push(`/DAP/config/create?id=${(_record as any).id}`)">编辑</Button>
              <Button type="link" size="small" @click="handlePublish(_record as ApiConfig)" :disabled="(_record as any).status === 'published'">发布</Button>
              <Button type="link" size="small" @click="handleDeprecate(_record as ApiConfig)" :disabled="(_record as any).status === 'deprecated'">废弃</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as ApiConfig)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
