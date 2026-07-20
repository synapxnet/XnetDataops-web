<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Form, FormItem, Input, InputNumber, Select, SelectOption, Button, Textarea, Space, message } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { createAsset, updateAsset, getAsset } from '../api/dataAsset';

const router = useRouter();
const route = useRoute();
const editId = ref<number | null>(null);

const formState = reactive({
  name: '',
  assetType: 'table',
  category: '一般',
  domain: '用户',
  owner: '',
  description: '',
  accessLevel: 'internal',
  datasourceId: undefined as number | undefined,
  tableName: '',
  status: 'active',
  rowCount: 0,
  dataSizeBytes: 0,
});

const assetTypes = ['table', 'view', 'file', 'api', 'stream'];
const categories = ['核心', '重要', '一般'];
const domains = ['用户', '订单', '财务', '运营'];
const accessLevels = ['public', 'internal', 'confidential', 'restricted'];
const statuses = ['active', 'inactive', 'deprecated'];

async function handleSubmit() {
  if (!formState.name) {
    message.error('资产名称不能为空');
    return;
  }
  try {
    if (editId.value) {
      await updateAsset(editId.value, { ...formState });
      message.success('更新成功');
    } else {
      await createAsset({ ...formState });
      message.success('创建成功');
    }
    router.push('/DAS/asset/list');
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

onMounted(async () => {
  const id = route.query.id;
  if (id) {
    editId.value = Number(id);
    try {
      const asset = await getAsset(editId.value);
      Object.assign(formState, asset);
    } catch (e: any) {
      message.error('获取资产详情失败');
    }
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="editId ? '编辑资产' : '新建资产'">
      <Form layout="vertical" style="max-width: 600px;">
        <FormItem label="资产名称" required>
          <Input v-model:value="formState.name" placeholder="请输入资产名称" />
        </FormItem>
        <FormItem label="资产类型" required>
          <Select v-model:value="formState.assetType">
            <SelectOption v-for="t in assetTypes" :key="t" :value="t">{{ t }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="业务域" required>
          <Select v-model:value="formState.domain">
            <SelectOption v-for="d in domains" :key="d" :value="d">{{ d }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="分类" required>
          <Select v-model:value="formState.category">
            <SelectOption v-for="c in categories" :key="c" :value="c">{{ c }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="访问级别">
          <Select v-model:value="formState.accessLevel">
            <SelectOption v-for="a in accessLevels" :key="a" :value="a">{{ a }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="formState.status">
            <SelectOption v-for="s in statuses" :key="s" :value="s">{{ s }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="所有者">
          <Input v-model:value="formState.owner" placeholder="资产所有者" />
        </FormItem>
        <FormItem label="数据源ID">
          <InputNumber v-model:value="formState.datasourceId" :min="1" style="width: 100%;" placeholder="关联数据源ID" />
        </FormItem>
        <FormItem label="表名">
          <Input v-model:value="formState.tableName" placeholder="关联表名" />
        </FormItem>
        <FormItem label="行数">
          <InputNumber v-model:value="formState.rowCount" :min="0" style="width: 100%;" />
        </FormItem>
        <FormItem label="数据大小(Bytes)">
          <InputNumber v-model:value="formState.dataSizeBytes" :min="0" style="width: 100%;" />
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="formState.description" :rows="3" placeholder="资产描述" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSubmit">{{ editId ? '更新' : '创建' }}</Button>
            <Button @click="router.back()">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
