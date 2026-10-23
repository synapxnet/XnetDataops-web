<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted } from 'vue';
import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { Table, Button, Tag, Space, Modal, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import {
  getDataSources,
  deleteDataSource,
  testConnection,
} from '../api/datasource';
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

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
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

/** 测试选中数据源的连接。 Test connectivity for the selected data source. */
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

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
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

        throw e;
      }
    },
  });
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="连接企业数据源，验证连通性并管理访问配置。"
    title="数据源列表"
  >
    <template #extra>
      <Button type="primary" @click="router.push('/DSM/datasource/create')"
        ><template #icon><PlusOutlined /></template>新建数据源</Button
      >
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1200 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'name'">
          <div class="datasource-identity">
            <span class="datasource-identity-icon"><DatabaseOutlined /></span
            ><strong>{{ (_record as any).name }}</strong>
          </div>
        </template>
        <template v-if="column.key === 'type'">
          <Tag class="datasource-type">{{ (_record as any).type }}</Tag>
        </template>
        <template v-if="column.key === 'status'">
          <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{
            (_record as any).status
          }}</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="handleTest(_record as DataSource)"
              >测试连接</Button
            >
            <Button
              type="link"
              size="small"
              @click="
                router.push(`/DSM/datasource/create?id=${(_record as any).id}`)
              "
              >编辑</Button
            >
            <Button
              type="link"
              size="small"
              danger
              @click="handleDelete(_record as DataSource)"
              >删除</Button
            >
          </Space>
        </template>
      </template>
    </Table>
  </DataPage>
</template>

<style scoped>
.datasource-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}
.datasource-identity strong {
  font-size: 13px;
  font-weight: 550;
}
.datasource-identity-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: calc(var(--dataops-radius) * 0.55);
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.08);
  font-size: 15px;
}
.datasource-type {
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.06);
  border-color: hsl(var(--primary) / 0.16);
  font-size: 12px;
}
</style>
