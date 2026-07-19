<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, Form, FormItem, Input, Select, SelectOption, Switch, Textarea, message } from 'ant-design-vue';
import { getQualityRules, createQualityRule, updateQualityRule, deleteQualityRule } from '../api/qualityRule';
import type { QualityRule } from '../api/types';

const loading = ref(false);
const dataList = ref<QualityRule[]>([]);

const columns = [
  { title: '规则名称', dataIndex: 'name', key: 'name' },
  { title: '表名', dataIndex: 'tableName', key: 'tableName' },
  { title: '列名', dataIndex: 'columnName', key: 'columnName', width: 120 },
  { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 120 },
  { title: '严重级别', dataIndex: 'severity', key: 'severity', width: 100 },
  { title: '启用', dataIndex: 'enabled', key: 'enabled', width: 80 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const severityColorMap: Record<string, string> = { info: 'blue', warning: 'orange', critical: 'red' };
const ruleTypeColorMap: Record<string, string> = { not_null: 'blue', unique: 'green', range: 'orange', regex: 'purple', custom_sql: 'cyan' };

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({
  name: '', tableName: '', columnName: '', ruleType: 'not_null',
  ruleExpression: '', severity: 'warning', enabled: true, scheduleCron: '', description: '',
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getQualityRules();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取规则列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  editingId.value = null;
  Object.assign(formState, { name: '', tableName: '', columnName: '', ruleType: 'not_null', ruleExpression: '', severity: 'warning', enabled: true, scheduleCron: '', description: '' });
  modalVisible.value = true;
}

function showEdit(record: QualityRule) {
  editingId.value = record.id;
  Object.assign(formState, { name: record.name, tableName: record.tableName, columnName: record.columnName, ruleType: record.ruleType, ruleExpression: record.ruleExpression, severity: record.severity, enabled: record.enabled, scheduleCron: record.scheduleCron, description: record.description });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.name || !formState.tableName) { message.error('名称和表名不能为空'); return; }
  try {
    if (editingId.value) {
      await updateQualityRule(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createQualityRule({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: QualityRule) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除规则「${record.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteQualityRule(record.id); message.success('删除成功'); fetchList(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="质量规则">
      <template #extra><Button type="primary" @click="showCreate">新建规则</Button></template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1100 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'ruleType'">
            <Tag :color="ruleTypeColorMap[(_record as any).ruleType] || 'default'">{{ (_record as any).ruleType }}</Tag>
          </template>
          <template v-if="column.key === 'severity'">
            <Tag :color="severityColorMap[(_record as any).severity] || 'default'">{{ (_record as any).severity }}</Tag>
          </template>
          <template v-if="column.key === 'enabled'">
            <Tag :color="(_record as any).enabled ? 'green' : 'default'">{{ (_record as any).enabled ? '是' : '否' }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showEdit(_record as QualityRule)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as QualityRule)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="modalVisible" :title="editingId ? '编辑规则' : '新建规则'" @ok="handleSubmit" :destroy-on-close="true" width="600px">
      <Form layout="vertical">
        <FormItem label="规则名称" required><Input v-model:value="formState.name" /></FormItem>
        <FormItem label="表名" required><Input v-model:value="formState.tableName" /></FormItem>
        <FormItem label="列名"><Input v-model:value="formState.columnName" placeholder="为空则为表级规则" /></FormItem>
        <FormItem label="规则类型">
          <Select v-model:value="formState.ruleType">
            <SelectOption value="not_null">非空检查</SelectOption>
            <SelectOption value="unique">唯一性检查</SelectOption>
            <SelectOption value="range">范围检查</SelectOption>
            <SelectOption value="regex">正则检查</SelectOption>
            <SelectOption value="custom_sql">自定义SQL</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="规则表达式"><Textarea v-model:value="formState.ruleExpression" :rows="2" /></FormItem>
        <FormItem label="严重级别">
          <Select v-model:value="formState.severity">
            <SelectOption value="info">信息</SelectOption>
            <SelectOption value="warning">警告</SelectOption>
            <SelectOption value="critical">严重</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="启用"><Switch v-model:checked="formState.enabled" /></FormItem>
        <FormItem label="Cron"><Input v-model:value="formState.scheduleCron" placeholder="定时检测Cron" /></FormItem>
        <FormItem label="描述"><Textarea v-model:value="formState.description" :rows="2" /></FormItem>
      </Form>
    </Modal>
  </div>
</template>
