<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Table, Button, Tag, Space, Modal, Form, FormItem, Input, Select, SelectOption, message } from 'ant-design-vue';
import { getTags, createTag, updateTag, deleteTag } from '../api/tag';
import type { DataTag } from '../api/types';

const loading = ref(false);
const dataList = ref<DataTag[]>([]);

const columns = [
  { title: '标签名', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'tagType', key: 'tagType', width: 150 },
  { title: '颜色', dataIndex: 'color', key: 'color', width: 100 },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160 },
];

const tagTypeMap: Record<string, string> = { classification: '分类', sensitivity: '敏感度', business: '业务' };

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({ name: '', tagType: 'classification', color: '#1890ff', description: '' });

async function fetchList() {
  loading.value = true;
  try {
    const res = await getTags();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取标签列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function showCreate() {
  editingId.value = null;
  Object.assign(formState, { name: '', tagType: 'classification', color: '#1890ff', description: '' });
  modalVisible.value = true;
}

function showEdit(record: DataTag) {
  editingId.value = record.id;
  Object.assign(formState, { name: record.name, tagType: record.tagType, color: record.color, description: record.description });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.name) { message.error('标签名不能为空'); return; }
  try {
    if (editingId.value) {
      await updateTag(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createTag({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

function handleDelete(record: DataTag) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除标签「${record.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteTag(record.id); message.success('删除成功'); fetchList(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="数据标签">
      <template #extra><Button type="primary" @click="showCreate">新建标签</Button></template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'tagType'">
            {{ tagTypeMap[(_record as any).tagType] || (_record as any).tagType }}
          </template>
          <template v-if="column.key === 'color'">
            <Tag :color="(_record as any).color">{{ (_record as any).color }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showEdit(_record as DataTag)">编辑</Button>
              <Button type="link" size="small" danger @click="handleDelete(_record as DataTag)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="modalVisible" :title="editingId ? '编辑标签' : '新建标签'" @ok="handleSubmit" :destroy-on-close="true">
      <Form layout="vertical">
        <FormItem label="标签名" required><Input v-model:value="formState.name" /></FormItem>
        <FormItem label="类型">
          <Select v-model:value="formState.tagType">
            <SelectOption value="classification">分类</SelectOption>
            <SelectOption value="sensitivity">敏感度</SelectOption>
            <SelectOption value="business">业务</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="颜色"><Input v-model:value="formState.color" placeholder="#1890ff" /></FormItem>
        <FormItem label="描述"><Input v-model:value="formState.description" /></FormItem>
      </Form>
    </Modal>
  </div>
</template>
