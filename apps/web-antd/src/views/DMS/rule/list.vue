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
import { getRules, createRule, updateRule, deleteRule } from '../api/masking';
import type { MaskingRule } from '../api/types';

const loading = ref(false);
const dataList = ref<MaskingRule[]>([]);

const columns = [
  { title: '规则名称', dataIndex: 'name', key: 'name' },
  { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 120 },
  {
    title: '脱敏模式',
    dataIndex: 'maskPattern',
    key: 'maskPattern',
    width: 160,
  },
  {
    title: '替换字符',
    dataIndex: 'replacement',
    key: 'replacement',
    width: 100,
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' as const },
];

const ruleTypeColorMap: Record<string, string> = {
  phone: 'blue',
  email: 'cyan',
  idcard: 'orange',
  name: 'green',
  address: 'purple',
  bankcard: 'gold',
  custom: 'default',
};

const ruleTypeLabelMap: Record<string, string> = {
  phone: '手机号',
  email: '邮箱',
  idcard: '身份证',
  name: '姓名',
  address: '地址',
  bankcard: '银行卡',
  custom: '自定义',
};

const modalVisible = ref(false);
const editingId = ref<null | number>(null);
const formState = reactive({
  name: '',
  ruleType: 'phone',
  maskPattern: '',
  replacement: '*',
  description: '',
});

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getRules();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取规则列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  editingId.value = null;
  Object.assign(formState, {
    name: '',
    ruleType: 'phone',
    maskPattern: '',
    replacement: '*',
    description: '',
  });
  modalVisible.value = true;
}

/** 把选中记录复制到编辑草稿。 Copy the selected record into an edit draft. */
function showEdit(record: MaskingRule) {
  editingId.value = record.id;
  Object.assign(formState, {
    name: record.name,
    ruleType: record.ruleType,
    maskPattern: record.maskPattern,
    replacement: record.replacement,
    description: record.description,
  });
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!formState.name) {
    message.error('规则名称不能为空');
    return;
  }
  try {
    if (editingId.value) {
      await updateRule(editingId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createRule({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: MaskingRule) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除规则「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteRule(record.id);
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
    description="配置敏感数据保护，保留策略与执行记录。"
    title="脱敏规则"
  >
    <template #extra>
      <Button type="primary" @click="showCreate">新建规则</Button>
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 900 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'ruleType'">
          <Tag
            :color="ruleTypeColorMap[(_record as any).ruleType] || 'default'"
          >
            {{
              ruleTypeLabelMap[(_record as any).ruleType] ||
              (_record as any).ruleType
            }}
          </Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="showEdit(_record as MaskingRule)"
              >编辑</Button
            >
            <Button
              type="link"
              size="small"
              danger
              @click="handleDelete(_record as MaskingRule)"
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
      :title="editingId ? '编辑规则' : '新建规则'"
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
        <FormItem label="规则名称" required>
          <Input v-model:value="formState.name" placeholder="请输入规则名称" />
        </FormItem>
        <FormItem label="规则类型">
          <Select v-model:value="formState.ruleType">
            <SelectOption value="phone">手机号</SelectOption>
            <SelectOption value="email">邮箱</SelectOption>
            <SelectOption value="idcard">身份证</SelectOption>
            <SelectOption value="name">姓名</SelectOption>
            <SelectOption value="address">地址</SelectOption>
            <SelectOption value="bankcard">银行卡</SelectOption>
            <SelectOption value="custom">自定义</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="脱敏模式">
          <Input
            v-model:value="formState.maskPattern"
            placeholder="如: 前3后4, 正则表达式等"
          />
        </FormItem>
        <FormItem label="替换字符">
          <Input
            v-model:value="formState.replacement"
            placeholder="默认使用 *"
          />
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model:value="formState.description"
            :rows="3"
            placeholder="规则描述"
          />
        </FormItem>
      </Form>
    </Modal>
  </DataPage>
</template>
