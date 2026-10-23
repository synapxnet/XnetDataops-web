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
  Textarea,
  message,
} from 'ant-design-vue';
import {
  getScripts,
  createScript,
  updateScript,
  deleteScript,
} from '../api/sqlScript';
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

const statusColorMap: Record<string, string> = {
  draft: 'default',
  published: 'green',
};

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({
  name: '',
  scriptType: 'sql',
  folderPath: '/',
  content: '',
});

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
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

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  editingId.value = null;
  formState.name = '';
  formState.scriptType = 'sql';
  formState.folderPath = '/';
  formState.content = '';
  modalVisible.value = true;
}

/** 把选中记录复制到编辑草稿。 Copy the selected record into an edit draft. */
function showEdit(record: SqlScript) {
  editingId.value = record.id;
  formState.name = record.name;
  formState.scriptType = record.scriptType;
  formState.folderPath = record.folderPath;
  formState.content = record.content;
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!formState.name) {
    message.error('名称不能为空');
    return;
  }
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

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: SqlScript) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除脚本「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteScript(record.id);
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
    description="查询、开发与复用数据逻辑，保留执行过程。"
    title="脚本管理"
  >
    <template #extra
      ><Button type="primary" @click="showCreate">新建脚本</Button></template
    >
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'scriptType'">
          <Tag color="blue">{{ (_record as any).scriptType }}</Tag>
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
              @click="showEdit(_record as SqlScript)"
              >编辑</Button
            >
            <Button
              type="link"
              size="small"
              danger
              @click="handleDelete(_record as SqlScript)"
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
      :title="editingId ? '编辑脚本' : '新建脚本'"
      @ok="handleSubmit"
      :destroy-on-close="true"
      width="700px"
    >
      <Form
        :disabled="
          pageRequestState.writePending > 0 ||
          Object.keys(pageRequestState.failures).length > 0
        "
        layout="vertical"
      >
        <FormItem label="脚本名称" required
          ><Input v-model:value="formState.name" placeholder="脚本名称"
        /></FormItem>
        <FormItem label="类型"
          ><Select v-model:value="formState.scriptType"
            ><SelectOption value="sql">SQL</SelectOption
            ><SelectOption value="python">Python</SelectOption
            ><SelectOption value="shell">Shell</SelectOption></Select
          ></FormItem
        >
        <FormItem label="目录"
          ><Input v-model:value="formState.folderPath" placeholder="/"
        /></FormItem>
        <FormItem label="内容"
          ><Textarea
            v-model:value="formState.content"
            :rows="10"
            style="font-family: monospace"
        /></FormItem>
      </Form>
    </Modal>
  </DataPage>
</template>
