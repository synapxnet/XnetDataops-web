<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, Form, FormItem, Input, Textarea, message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getWorkflows, createWorkflow, deleteWorkflow, updateWorkflowStatus, triggerWorkflow } from '../api/workflow';
import type { Workflow } from '../api/types';

const router = useRouter();
const loading = ref(false);
const dataList = ref<Workflow[]>([]);

const columns = [
  { title: '工作流名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: 'Cron', dataIndex: 'scheduleCron', key: 'scheduleCron', width: 130 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'action', width: 320, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = { draft: 'default', online: 'green', offline: 'orange' };

const modalVisible = ref(false);
const formState = reactive({ name: '', description: '', scheduleCron: '' });

async function fetchList() {
  loading.value = true;
  try {
    const res = await getWorkflows();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取工作流列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  formState.name = '';
  formState.description = '';
  formState.scheduleCron = '';
  modalVisible.value = true;
}

async function handleCreate() {
  if (!formState.name) { message.error('名称不能为空'); return; }
  try {
    const wf = await createWorkflow({ ...formState });
    message.success('创建成功');
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  }
}

async function handleStatusChange(record: Workflow, status: string) {
  try {
    await updateWorkflowStatus(record.id, status);
    message.success('状态更新成功');
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

async function handleTrigger(record: Workflow) {
  try {
    await triggerWorkflow(record.id);
    message.success('已触发执行');
  } catch (e: any) {
    message.error('触发失败: ' + e.message);
  }
}

function handleDelete(record: Workflow) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除工作流「${record.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteWorkflow(record.id); message.success('删除成功'); fetchList(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="工作流列表">
      <template #extra><Button type="primary" @click="showCreate">新建工作流</Button></template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1200 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="router.push(`/TSK/workflow/design/${(_record as any).id}`)">编排</Button>
              <Button type="link" size="small" @click="handleTrigger(_record as Workflow)">执行</Button>
              <Button type="link" size="small" @click="handleStatusChange(_record as Workflow, (_record as any).status === 'online' ? 'offline' : 'online')">
                {{ (_record as any).status === 'online' ? '下线' : '上线' }}
              </Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as Workflow)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="modalVisible" title="新建工作流" @ok="handleCreate" :destroy-on-close="true">
      <Form layout="vertical">
        <FormItem label="工作流名称" required><Input v-model:value="formState.name" placeholder="工作流名称" /></FormItem>
        <FormItem label="描述"><Textarea v-model:value="formState.description" :rows="2" /></FormItem>
        <FormItem label="Cron表达式"><Input v-model:value="formState.scheduleCron" placeholder="例如: 0 0 2 * * ?" /></FormItem>
      </Form>
    </Modal>
  </div>
</template>
