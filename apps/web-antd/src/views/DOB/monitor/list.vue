<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, Form, FormItem, Input, Select, SelectOption, Switch, Textarea, message } from 'ant-design-vue';
import { getMonitors, createMonitor, updateMonitor, deleteMonitor, toggleMonitor } from '../api/monitor';
import type { DataMonitor } from '../api/types';

const loading = ref(false);
const dataList = ref<DataMonitor[]>([]);

const columns = [
  { title: '监控名称', dataIndex: 'name', key: 'name' },
  { title: '表名', dataIndex: 'tableName', key: 'tableName' },
  { title: '监控类型', dataIndex: 'monitorType', key: 'monitorType', width: 120 },
  { title: '告警级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 100 },
  { title: '启用', dataIndex: 'enabled', key: 'enabled', width: 80 },
  { title: 'Cron', dataIndex: 'scheduleCron', key: 'scheduleCron', width: 140 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
];

const monitorTypeColorMap: Record<string, string> = { freshness: 'blue', volume: 'green', schema: 'purple', custom: 'cyan' };
const alertLevelColorMap: Record<string, string> = { info: 'blue', warning: 'orange', critical: 'red' };

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({
  name: '', datasourceId: undefined as number | undefined, tableName: '', monitorType: 'freshness',
  checkExpression: '', thresholdValue: '', alertLevel: 'warning', enabled: true, scheduleCron: '', description: '',
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getMonitors();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取监控列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  editingId.value = null;
  Object.assign(formState, { name: '', datasourceId: undefined, tableName: '', monitorType: 'freshness', checkExpression: '', thresholdValue: '', alertLevel: 'warning', enabled: true, scheduleCron: '', description: '' });
  modalVisible.value = true;
}

function showEdit(record: DataMonitor) {
  editingId.value = record.id;
  Object.assign(formState, { name: record.name, datasourceId: record.datasourceId, tableName: record.tableName, monitorType: record.monitorType, checkExpression: record.checkExpression, thresholdValue: record.thresholdValue, alertLevel: record.alertLevel, enabled: record.enabled, scheduleCron: record.scheduleCron, description: record.description });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.name || !formState.tableName) { message.error('名称和表名不能为空'); return; }
  try {
    if (editingId.value) {
      await updateMonitor(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createMonitor({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

async function handleToggle(record: DataMonitor) {
  try {
    await toggleMonitor(record.id);
    message.success(record.enabled ? '已禁用' : '已启用');
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: DataMonitor) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除监控「${record.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteMonitor(record.id); message.success('删除成功'); fetchList(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="数据监控">
      <template #extra><Button type="primary" @click="showCreate">新建监控</Button></template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1100 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'monitorType'">
            <Tag :color="monitorTypeColorMap[(_record as any).monitorType] || 'default'">{{ (_record as any).monitorType }}</Tag>
          </template>
          <template v-if="column.key === 'alertLevel'">
            <Tag :color="alertLevelColorMap[(_record as any).alertLevel] || 'default'">{{ (_record as any).alertLevel }}</Tag>
          </template>
          <template v-if="column.key === 'enabled'">
            <Tag :color="(_record as any).enabled ? 'green' : 'default'">{{ (_record as any).enabled ? '是' : '否' }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showEdit(_record as DataMonitor)">编辑</Button>
              <Button type="link" size="small" @click="handleToggle(_record as DataMonitor)">{{ (_record as any).enabled ? '禁用' : '启用' }}</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as DataMonitor)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="modalVisible" :title="editingId ? '编辑监控' : '新建监控'" @ok="handleSubmit" :destroy-on-close="true" width="600px">
      <Form layout="vertical">
        <FormItem label="监控名称" required><Input v-model:value="formState.name" /></FormItem>
        <FormItem label="表名" required><Input v-model:value="formState.tableName" /></FormItem>
        <FormItem label="监控类型">
          <Select v-model:value="formState.monitorType">
            <SelectOption value="freshness">新鲜度</SelectOption>
            <SelectOption value="volume">数据量</SelectOption>
            <SelectOption value="schema">Schema变更</SelectOption>
            <SelectOption value="custom">自定义</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="检查表达式"><Textarea v-model:value="formState.checkExpression" :rows="2" /></FormItem>
        <FormItem label="阈值"><Input v-model:value="formState.thresholdValue" /></FormItem>
        <FormItem label="告警级别">
          <Select v-model:value="formState.alertLevel">
            <SelectOption value="info">信息</SelectOption>
            <SelectOption value="warning">警告</SelectOption>
            <SelectOption value="critical">严重</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="启用"><Switch v-model:checked="formState.enabled" /></FormItem>
        <FormItem label="Cron"><Input v-model:value="formState.scheduleCron" placeholder="调度Cron表达式" /></FormItem>
        <FormItem label="描述"><Textarea v-model:value="formState.description" :rows="2" /></FormItem>
      </Form>
    </Modal>
  </div>
</template>
