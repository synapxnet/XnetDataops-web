<script lang="ts" setup>
const pageRequestState = pageState();
import { pageState } from '#/components/data-page/request-state';
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted, reactive } from 'vue';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  FormItem,
  Input,
  Textarea,
  message,
} from 'ant-design-vue';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleUsers,
} from '../api/role';
import type { Role, UserRoleCluster } from '../api/types';

const loading = ref(false);
const roles = ref<Role[]>([]);

const columns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode', width: 150 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
];

// Form modal
const modalVisible = ref(false);
const modalTitle = ref('创建角色');
const editingId = ref<null | number>(null);
const formState = reactive({
  roleName: '',
  roleCode: '',
  description: '',
});

// Users modal
const usersModalVisible = ref(false);
const usersModalTitle = ref('');
const roleUsers = ref<UserRoleCluster[]>([]);
const usersLoading = ref(false);

const userColumns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
];

/** 载入可用角色资料。 Load available role records. */
async function fetchRoles() {
  loading.value = true;
  try {
    const res = await getRoles();
    roles.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取角色列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  editingId.value = null;
  modalTitle.value = '创建角色';
  formState.roleName = '';
  formState.roleCode = '';
  formState.description = '';
  modalVisible.value = true;
}

/** 把选中记录复制到编辑草稿。 Copy the selected record into an edit draft. */
function showEdit(record: Role) {
  editingId.value = record.id;
  modalTitle.value = '编辑角色';
  formState.roleName = record.roleName;
  formState.roleCode = record.roleCode;
  formState.description = record.description || '';
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  try {
    if (editingId.value) {
      await updateRole(editingId.value, {
        roleName: formState.roleName,
        description: formState.description,
      });
      message.success('更新成功');
    } else {
      if (!formState.roleName || !formState.roleCode) {
        message.error('角色名称和编码不能为空');
        return;
      }
      await createRole({ ...formState });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchRoles();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: Role) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色「${record.roleName}」吗？关联的用户角色映射也将被删除。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteRole(record.id);
        message.success('删除成功');
        fetchRoles();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);

        throw e;
      }
    },
  });
}

/** 载入选中角色的用户关联。 Load users assigned to the selected role. */
async function showUsers(record: Role) {
  usersModalTitle.value = `${record.roleName} - 关联用户`;
  usersModalVisible.value = true;
  usersLoading.value = true;
  try {
    const res = await getRoleUsers(record.id);
    roleUsers.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取用户失败: ' + e.message);
  } finally {
    usersLoading.value = false;
  }
}

onMounted(() => {
  fetchRoles();
});
</script>

<template>
  <DataPage description="管理平台成员、角色与授权范围。" title="角色管理">
    <template #extra>
      <Button type="primary" @click="showCreate">创建角色</Button>
    </template>
    <Table
      :columns="columns"
      :data-source="roles"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 800 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="showUsers(_record as Role)"
            >
              关联用户
            </Button>
            <Button type="link" size="small" @click="showEdit(_record as Role)">
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              danger
              @click="handleDelete(_record as Role)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <!-- Create/Edit Role Modal -->
    <Modal
      :mask-closable="false"
      :confirm-loading="pageRequestState.writePending > 0"
      v-model:open="modalVisible"
      :title="modalTitle"
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
        <FormItem label="角色名称" required>
          <Input v-model:value="formState.roleName" placeholder="如: 管理员" />
        </FormItem>
        <FormItem label="角色编码" required>
          <Input
            v-model:value="formState.roleCode"
            placeholder="如: ADMIN"
            :disabled="!!editingId"
          />
        </FormItem>
        <FormItem label="描述">
          <Textarea v-model:value="formState.description" :rows="3" />
        </FormItem>
      </Form>
    </Modal>

    <!-- Role Users Modal -->
    <Modal
      :mask-closable="false"
      :confirm-loading="pageRequestState.writePending > 0"
      v-model:open="usersModalVisible"
      :title="usersModalTitle"
      :footer="null"
      width="400px"
    >
      <Table
        :scroll="{ x: 'max-content' }"
        :columns="userColumns"
        :data-source="roleUsers"
        :loading="usersLoading"
        row-key="id"
        size="small"
      />
    </Modal>
  </DataPage>
</template>
