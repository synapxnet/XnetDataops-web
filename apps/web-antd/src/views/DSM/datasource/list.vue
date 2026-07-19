<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getDataSources, deleteDataSource, testConnection } from '../api/datasource';
import type { DataSource } from '../api/types';

const router = useRouter();
const loading = ref(false);
const dataList = ref<DataSource[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '主机', dataIndex: 'host', key: 'host' },
  { title: '端口', dataIndex: 'port', key: 'port', width: 80 },
  { title: '数据库', dataIndex: 'databaseName', key: 'databaseName' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 240, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  error: 'red',
};

const typeColorMap: Record<string, string> = {
  MYSQL: 'blue',
  POSTGRESQL: 'cyan',
  ORACLE: 'orange',
  HIVE: 'purple',
  KAFKA: 'green',
  S3: 'gold',
  FTP: 'lime',
  API: 'magenta',
};

async function fetchList() {
  loading.value = true;
  try {
    const res = await getDataSources();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取数据源列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

async function handleTest(record: DataSource) {
  try {
    const res = await testConnection(record.id);
    if (res.success) {
      message.success('连接测试成功');
    } else {
      message.warning('连接测试失败');
    }
    fetchList();
  } catch (e: any) {
    message.error('测试失败: ' + e.message);
  }
}

function handleDelete(record: DataSource) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除数据源「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteDataSource(record.id);
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
    <Card title="数据源列表">
      <template #extra>
        <Button type="primary" @click="router.push('/DSM/datasource/create')">新建数据源</Button>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'type'">
            <Tag :color="typeColorMap[(_record as any).type] || 'default'">{{ (_record as any).type }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleTest(_record as DataSource)">测试连接</Button>
              <Button type="link" size="small" @click="router.push(`/DSM/datasource/create?id=${(_record as any).id}`)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as DataSource)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
