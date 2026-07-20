<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, Form, FormItem, Input, Select, SelectOption, Textarea, message } from 'ant-design-vue';
import { getScripts, createScript, updateScript, deleteScript } from '../api/sqlScript';
import type { SqlScript } from '../api/types';

const loading = ref(false);
const dataList = ref<SqlScript[]>([]);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'scriptType', key: 'scriptType', width: 100 },
  { title: '目录', dataIndex: 'folderPath', key: 'folderPath', width: 150 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = { draft: 'default', published: 'green' };

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({ name: '', scriptType: 'sql', folderPath: '/', content: '' });

async function fetchList() {
  loading.value = true;
  try {
    const res = await getScripts();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取脚本列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  editingId.value = null;
  formState.name = '';
  formState.scriptType = 'sql';
  formState.folderPath = '/';
  formState.content = '';
  modalVisible.value = true;
}

function showEdit(record: SqlScript) {
  editingId.value = record.id;
  formState.name = record.name;
  formState.scriptType = record.scriptType;
  formState.folderPath = record.folderPath;
  formState.content = record.content;
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.name) { message.error('名称不能为空'); return; }
  try {
    if (editingId.value) {
      await updateScript(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createScript({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: SqlScript) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除脚本「${record.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteScript(record.id); message.success('删除成功'); fetchList(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="脚本管理">
      <template #extra><Button type="primary" @click="showCreate">新建脚本</Button></template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'scriptType'">
            <Tag color="blue">{{ (_record as any).scriptType }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showEdit(_record as SqlScript)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as SqlScript)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="modalVisible" :title="editingId ? '编辑脚本' : '新建脚本'" @ok="handleSubmit" :destroy-on-close="true" width="700px">
      <Form layout="vertical">
        <FormItem label="脚本名称" required><Input v-model:value="formState.name" placeholder="脚本名称" /></FormItem>
        <FormItem label="类型"><Select v-model:value="formState.scriptType"><SelectOption value="sql">SQL</SelectOption><SelectOption value="python">Python</SelectOption><SelectOption value="shell">Shell</SelectOption></Select></FormItem>
        <FormItem label="目录"><Input v-model:value="formState.folderPath" placeholder="/" /></FormItem>
        <FormItem label="内容"><Textarea v-model:value="formState.content" :rows="10" style="font-family: monospace;" /></FormItem>
      </Form>
    </Modal>
  </div>
</template>
