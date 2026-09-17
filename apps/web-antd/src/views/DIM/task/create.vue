<script lang="ts" setup>
const pageRequestState = pageState();
import { pageState } from '#/components/data-page/request-state';
import DataPage from '#/components/data-page/index.vue';
import { onMounted, reactive, ref } from 'vue';
import {
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Button,
  Textarea,
  Space,
  message,
} from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getDataSources } from '#/views/DSM/api/datasource';
import type { DataSource } from '#/views/DSM/api/types';
import { createSyncTask } from '../api/syncTask';

const router = useRouter();
const dataSources = ref<DataSource[]>([]);

const formState = reactive({
  name: '',
  sourceDsId: undefined as number | undefined,
  targetDsId: undefined as number | undefined,
  sourceTable: '',
  targetTable: '',
  syncMode: 'full',
  incrementalField: '',
  scheduleCron: '',
  description: '',
});

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (
    !formState.name ||
    !formState.sourceTable ||
    !formState.targetTable ||
    !formState.sourceDsId ||
    !formState.targetDsId
  ) {
    message.error('请选择源和目标数据源，并填写任务名称、源表和目标表');
    return;
  }
  try {
    await createSyncTask({ ...formState });
    message.success('创建成功');
    router.push('/DIM/task/list');
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  }
}

/** 读取真实数据源用于同步源与目标选择。 Load actual data sources for selecting sync origins and destinations. */
async function loadDataSources() {
  try {
    dataSources.value = await getDataSources();
  } catch {
    message.error('数据源暂不可用，请刷新后重试');
  }
}
onMounted(loadDataSources);
</script>

<template>
  <DataPage
    description="把数据从来源送达目标，跟踪每次同步与执行记录。"
    title="创建同步任务"
  >
    <Form
      :disabled="
        pageRequestState.writePending > 0 ||
        Object.keys(pageRequestState.failures).length > 0
      "
      layout="vertical"
      style="max-width: 600px"
    >
      <FormItem label="任务名称" required>
        <Input v-model:value="formState.name" placeholder="请输入任务名称" />
      </FormItem>
      <FormItem label="同步模式">
        <Select v-model:value="formState.syncMode">
          <SelectOption value="full">全量同步</SelectOption>
          <SelectOption value="incremental">增量同步</SelectOption>
        </Select>
      </FormItem>
      <FormItem label="源数据源" required
        ><Select
          v-model:value="formState.sourceDsId"
          placeholder="选择数据来源"
          :options="
            dataSources.map((source) => ({
              label: source.name + ' / ' + source.type,
              value: source.id,
            }))
          "
      /></FormItem>
      <FormItem label="目标数据源" required
        ><Select
          v-model:value="formState.targetDsId"
          placeholder="选择数据目标"
          :options="
            dataSources.map((source) => ({
              label: source.name + ' / ' + source.type,
              value: source.id,
            }))
          "
      /></FormItem>
      <FormItem label="源表" required>
        <Input v-model:value="formState.sourceTable" placeholder="源数据表名" />
      </FormItem>
      <FormItem label="目标表" required>
        <Input
          v-model:value="formState.targetTable"
          placeholder="目标数据表名"
        />
      </FormItem>
      <FormItem label="增量字段" v-if="formState.syncMode === 'incremental'">
        <Input
          v-model:value="formState.incrementalField"
          placeholder="增量字段名"
        />
      </FormItem>
      <FormItem label="Cron 表达式">
        <Input
          v-model:value="formState.scheduleCron"
          placeholder="例如: 0 0 2 * * ?"
        />
      </FormItem>
      <FormItem label="描述">
        <Textarea
          v-model:value="formState.description"
          :rows="2"
          placeholder="任务描述"
        />
      </FormItem>
      <FormItem>
        <Space>
          <Button
            :loading="pageRequestState.writePending > 0"
            type="primary"
            @click="handleSubmit"
            >创建</Button
          >
          <Button @click="router.back()">取消</Button>
        </Space>
      </FormItem>
    </Form>
  </DataPage>
</template>
