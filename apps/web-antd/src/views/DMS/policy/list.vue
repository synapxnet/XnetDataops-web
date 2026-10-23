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
  Switch,
  Textarea,
  message,
} from 'ant-design-vue';
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  togglePolicy,
} from '../api/masking';
import type { MaskingPolicy } from '../api/types';

const loading = ref(false);
const dataList = ref<MaskingPolicy[]>([]);
const filterDatasourceId = ref<number | undefined>(undefined);

const columns = [
  { title: '策略名称', dataIndex: 'name', key: 'name' },
  { title: '表名', dataIndex: 'tableName', key: 'tableName' },
  { title: '列名', dataIndex: 'columnName', key: 'columnName', width: 120 },
  { title: '规则ID', dataIndex: 'ruleId', key: 'ruleId', width: 100 },
  { title: '启用状态', dataIndex: 'enabled', key: 'enabled', width: 100 },
  { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
];

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({
  name: '',
  datasourceId: undefined as number | undefined,
  tableName: '',
  columnName: '',
  ruleId: undefined as number | undefined,
  enabled: true,
  priority: 0,
  description: '',
});

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getPolicies(filterDatasourceId.value);
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取策略列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  editingId.value = null;
  Object.assign(formState, {
    name: '',
    datasourceId: undefined,
    tableName: '',
    columnName: '',
    ruleId: undefined,
    enabled: true,
    priority: 0,
    description: '',
  });
  modalVisible.value = true;
}

/** 把选中记录复制到编辑草稿。 Copy the selected record into an edit draft. */
function showEdit(record: MaskingPolicy) {
  editingId.value = record.id;
  Object.assign(formState, {
    name: record.name,
    datasourceId: record.datasourceId,
    tableName: record.tableName,
    columnName: record.columnName,
    ruleId: record.ruleId,
    enabled: record.enabled,
    priority: record.priority,
    description: record.description,
  });
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!formState.name || !formState.tableName || !formState.columnName) {
    message.error('策略名称、表名和列名不能为空');
    return;
  }
  try {
    if (editingId.value) {
      await updatePolicy(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createPolicy({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

/** 切换选中资源状态并刷新列表。 Toggle the selected resource state and refresh the list. */
async function handleToggle(record: MaskingPolicy) {
  try {
    await togglePolicy(record.id);
    message.success(record.enabled ? '已禁用' : '已启用');
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: MaskingPolicy) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除策略「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deletePolicy(record.id);
        message.success('删除成功');
        fetchList();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);

        throw e;
      }
    },
  });
}

/** 应用当前筛选条件。 Apply the current filters. */
function handleFilter() {
  fetchList();
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="配置敏感数据保护，保留策略与执行记录。"
    title="脱敏策略"
  >
    <template #extra>
      <Space>
        <InputNumber
          v-model:value="filterDatasourceId"
          placeholder="按数据源ID筛选"
          :min="1"
          style="width: 180px"
          @press-enter="handleFilter"
        />
        <Button @click="handleFilter">筛选</Button>
        <Button type="primary" @click="showCreate">新建策略</Button>
      </Space>
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'enabled'">
          <Tag :color="(_record as any).enabled ? 'green' : 'default'">
            {{ (_record as any).enabled ? '已启用' : '已禁用' }}
          </Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="showEdit(_record as MaskingPolicy)"
              >编辑</Button
            >
            <Button
              type="link"
              size="small"
              @click="handleToggle(_record as MaskingPolicy)"
            >
              {{ (_record as any).enabled ? '禁用' : '启用' }}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              @click="handleDelete(_record as MaskingPolicy)"
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
      :title="editingId ? '编辑策略' : '新建策略'"
      :destroy-on-close="true"
      width="600px"
      @ok="handleSubmit"
    >
      <Form
        :disabled="
          pageRequestState.writePending > 0 ||
          Object.keys(pageRequestState.failures).length > 0
        "
        layout="vertical"
      >
        <FormItem label="策略名称" required>
          <Input v-model:value="formState.name" placeholder="请输入策略名称" />
        </FormItem>
        <FormItem label="数据源ID">
          <InputNumber
            v-model:value="formState.datasourceId"
            :min="1"
            placeholder="请输入数据源ID"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="表名" required>
          <Input v-model:value="formState.tableName" placeholder="请输入表名" />
        </FormItem>
        <FormItem label="列名" required>
          <Input
            v-model:value="formState.columnName"
            placeholder="请输入列名"
          />
        </FormItem>
        <FormItem label="规则ID">
          <InputNumber
            v-model:value="formState.ruleId"
            :min="1"
            placeholder="请输入关联的规则ID"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="启用">
          <Switch v-model:checked="formState.enabled" />
        </FormItem>
        <FormItem label="优先级">
          <InputNumber
            v-model:value="formState.priority"
            :min="0"
            placeholder="数字越小优先级越高"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model:value="formState.description"
            :rows="3"
            placeholder="策略描述"
          />
        </FormItem>
      </Form>
    </Modal>
  </DataPage>
</template>
