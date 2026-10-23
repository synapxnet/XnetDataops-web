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
  InputNumber,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import {
  getClassifications,
  createClassification,
  updateClassification,
  deleteClassification,
} from '../api/dataAsset';
import type { AssetClassification } from '../api/types';

const loading = ref(false);
const dataList = ref<AssetClassification[]>([]);

const columns = [
  { title: '分类名称', dataIndex: 'name', key: 'name' },
  { title: '层级', dataIndex: 'level', key: 'level', width: 80 },
  { title: '父级ID', dataIndex: 'parentId', key: 'parentId', width: 100 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160 },
];

const levelColorMap: Record<string, string> = {
  L1: 'red',
  L2: 'orange',
  L3: 'blue',
};

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({
  name: '',
  level: 'L1',
  parentId: 0,
  description: '',
  sortOrder: 0,
});

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getClassifications();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取分类列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  editingId.value = null;
  Object.assign(formState, {
    name: '',
    level: 'L1',
    parentId: 0,
    description: '',
    sortOrder: 0,
  });
  modalVisible.value = true;
}

/** 把选中记录复制到编辑草稿。 Copy the selected record into an edit draft. */
function showEdit(record: AssetClassification) {
  editingId.value = record.id;
  Object.assign(formState, {
    name: record.name,
    level: record.level,
    parentId: record.parentId,
    description: record.description,
    sortOrder: record.sortOrder,
  });
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!formState.name) {
    message.error('分类名称不能为空');
    return;
  }
  try {
    if (editingId.value) {
      await updateClassification(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createClassification({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: AssetClassification) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分类「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteClassification(record.id);
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
    description="发现可用资产，整理分类与使用信息。"
    title="资产分类管理"
  >
    <template #extra
      ><Button type="primary" @click="showCreate">新建分类</Button></template
    >
    <Table
      :scroll="{ x: 'max-content' }"
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'level'">
          <Tag :color="levelColorMap[(_record as any).level] || 'default'">{{
            (_record as any).level
          }}</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="showEdit(_record as AssetClassification)"
              >编辑</Button
            >
            <Button
              type="link"
              size="small"
              danger
              @click="handleDelete(_record as AssetClassification)"
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
      :title="editingId ? '编辑分类' : '新建分类'"
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
        <FormItem label="分类名称" required
          ><Input v-model:value="formState.name" placeholder="请输入分类名称"
        /></FormItem>
        <FormItem label="层级">
          <Select v-model:value="formState.level">
            <SelectOption value="L1">L1 - 一级分类</SelectOption>
            <SelectOption value="L2">L2 - 二级分类</SelectOption>
            <SelectOption value="L3">L3 - 三级分类</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="父级ID">
          <InputNumber
            v-model:value="formState.parentId"
            :min="0"
            style="width: 100%"
            placeholder="0表示顶级分类"
          />
        </FormItem>
        <FormItem label="排序">
          <InputNumber
            v-model:value="formState.sortOrder"
            :min="0"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="描述"
          ><Input v-model:value="formState.description" placeholder="分类描述"
        /></FormItem>
      </Form>
    </Modal>
  </DataPage>
</template>
