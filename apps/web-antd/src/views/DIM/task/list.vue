<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getSyncTasks, deleteSyncTask, updateTaskStatus } from '../api/syncTask';
import type { SyncTask } from '../api/types';

const router = useRouter();
const loading = ref(false);
const dataList = ref<SyncTask[]>([]);

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '同步模式', dataIndex: 'syncMode', key: 'syncMode', width: 100 },
  { title: '源表', dataIndex: 'sourceTable', key: 'sourceTable' },
  { title: '目标表', dataIndex: 'targetTable', key: 'targetTable' },
  { title: 'Cron', dataIndex: 'scheduleCron', key: 'scheduleCron', width: 130 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  draft: 'default',
  online: 'green',
  offline: 'orange',
  running: 'blue',
  error: 'red',
};

async function fetchList() {
  loading.value = true;
  try {
    const res = await getSyncTasks();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取任务列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

async function handleStatusChange(record: SyncTask, status: string) {
  try {
    await updateTaskStatus(record.id, status);
    message.success('状态更新成功');
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: SyncTask) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除任务「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteSyncTask(record.id);
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
    <Card title="同步任务列表">
      <template #extra>
        <Button type="primary" @click="router.push('/DIM/task/create')">创建任务</Button>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1300 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'syncMode'">
            <Tag :color="(_record as any).syncMode === 'full' ? 'blue' : 'green'">{{ (_record as any).syncMode === 'full' ? '全量' : '增量' }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleStatusChange(_record as SyncTask, 'online')" v-if="(_record as any).status !== 'online'">上线</Button>
              <Button type="link" size="small" @click="handleStatusChange(_record as SyncTask, 'offline')" v-if="(_record as any).status === 'online'">下线</Button>
              <Button type="link" size="small" @click="router.push(`/DIM/task/log/${(_record as any).id}`)">日志</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as SyncTask)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
