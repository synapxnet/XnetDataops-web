<script lang="ts" setup>
const pageRequestState = pageState();
import { pageState } from '#/components/data-page/request-state';
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted, reactive } from 'vue';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import { getTags, createTag, updateTag, deleteTag } from '../api/tag';
import type { DataTag } from '../api/types';

const loading = ref(false);
const dataList = ref<DataTag[]>([]);

const columns = [
  { title: '标签名', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'tagType', key: 'tagType', width: 150 },
  { title: '颜色', dataIndex: 'color', key: 'color', width: 100 },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160 },
];

const tagTypeMap: Record<string, string> = {
  classification: '分类',
  sensitivity: '敏感度',
  business: '业务',
};

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({
  name: '',
  tagType: 'classification',
  color: '#1890ff',
  description: '',
});

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
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

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  editingId.value = null;
  Object.assign(formState, {
    name: '',
    tagType: 'classification',
    color: '#1890ff',
    description: '',
  });
  modalVisible.value = true;
}

/** 把选中记录复制到编辑草稿。 Copy the selected record into an edit draft. */
function showEdit(record: DataTag) {
  editingId.value = record.id;
  Object.assign(formState, {
    name: record.name,
    tagType: record.tagType,
    color: record.color,
    description: record.description,
  });
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!formState.name) {
    message.error('标签名不能为空');
    return;
  }
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

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: DataTag) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除标签「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteTag(record.id);
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
    description="管理数据目录、血缘与治理证据，贯穿数据生命周期。"
    title="数据标签"
  >
    <template #extra
      ><Button type="primary" @click="showCreate">新建标签</Button></template
    >
    <Table
      :scroll="{ x: 'max-content' }"
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'tagType'">
          {{ tagTypeMap[(_record as any).tagType] || (_record as any).tagType }}
        </template>
        <template v-if="column.key === 'color'">
          <Tag :color="(_record as any).color">{{
            (_record as any).color
          }}</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="showEdit(_record as DataTag)"
              >编辑</Button
            >
            <Button
              type="link"
              size="small"
              danger
              @click="handleDelete(_record as DataTag)"
              >删除</Button
            >
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      :mask-closable="false"
      :confirm-loading="pageRequestState.writePending > 0"
      v-model:open="modalVisible"
      :title="editingId ? '编辑标签' : '新建标签'"
      @ok="handleSubmit"
      :destroy-on-close="true"
    >
      <Form
        :disabled="
          pageRequestState.writePending > 0 ||
          Object.keys(pageRequestState.failures).length > 0
        "
        layout="vertical"
      >
        <FormItem label="标签名" required
          ><Input v-model:value="formState.name"
        /></FormItem>
        <FormItem label="类型">
          <Select v-model:value="formState.tagType">
            <SelectOption value="classification">分类</SelectOption>
            <SelectOption value="sensitivity">敏感度</SelectOption>
            <SelectOption value="business">业务</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="颜色"
          ><Input v-model:value="formState.color" placeholder="#1890ff"
        /></FormItem>
        <FormItem label="描述"
          ><Input v-model:value="formState.description"
        /></FormItem>
      </Form>
    </Modal>
  </DataPage>
</template>
