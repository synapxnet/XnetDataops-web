/* Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：工作流编辑和保存回归。Purpose: Regress actual workflow editing and save interactions.
Author: maoyo | Department: 研发部 | Date: 2026-09-14 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Design from './design.vue';
import {
  clearPageStates,
  pageState,
} from '#/components/data-page/request-state';
import { saveDAG } from '../api/workflow';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '1' },
    path: '/TSK/workflow/design/1',
    meta: {},
  }),
  useRouter: () => ({ back: vi.fn() }),
  onBeforeRouteLeave: vi.fn(),
}));
vi.mock('../api/workflow', () => ({
  getWorkflow: vi.fn().mockResolvedValue({ id: 1, name: '编排测试' }),
  getNodes: vi.fn().mockImplementation(async () => [
    {
      id: 1,
      workflowId: 1,
      nodeKey: 'collect',
      nodeName: '采集',
      nodeType: 'sql',
      configJson: '{}',
      positionX: 0,
      positionY: 0,
    },
    {
      id: 2,
      workflowId: 1,
      nodeKey: 'validate',
      nodeName: '校验',
      nodeType: 'sql',
      configJson: '{}',
      positionX: 0,
      positionY: 0,
    },
  ]),
  getEdges: vi.fn().mockImplementation(async () => [
    {
      id: 1,
      workflowId: 1,
      sourceNodeKey: 'collect',
      targetNodeKey: 'validate',
    },
  ]),
  saveDAG: vi.fn(),
}));

const wrappers: ReturnType<typeof mount>[] = [];
/** 挂载真实编辑组件并等待初始图载入。 Mount the actual editor and wait for its initial graph. */
async function editor() {
  const wrapper = mount(Design, { attachTo: document.body });
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}
/** 按可见按钮文本触发真实点击。 Click an actual button by its visible text. */
async function click(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper
    .findAll('button')
    .find((item) => item.text() === label);
  expect(button, 'button ' + label).toBeDefined();
  await button!.trigger('click');
  await flushPromises();
}
beforeEach(() => {
  clearPageStates();
  vi.mocked(saveDAG).mockReset().mockResolvedValue(null);
});
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe('工作流真实按钮 / actual workflow buttons', () => {
  it('保存新独立节点与修改名称，并显示持续反馈 / saves an independent edited node with persistent feedback', async () => {
    const wrapper = await editor();
    await click(wrapper, '添加节点');
    const nameInput = wrapper
      .findAll('input')
      .find((input) => input.attributes('maxlength') === '120');
    await nameInput!.setValue('验收结果归档');
    expect(pageState().dirty).toBe(true);
    await click(wrapper, '保存编排');
    expect(saveDAG).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveDAG).mock.calls[0]![1]).toHaveLength(3);
    expect(vi.mocked(saveDAG).mock.calls[0]![1][2]!.nodeName).toBe(
      '验收结果归档',
    );
    expect(pageState().dirty).toBe(false);
    expect(wrapper.text()).toContain('工作流编排已保存');
  });

  it('保存失败保留图和修改提示 / preserves the graph and dirty state after failure', async () => {
    vi.mocked(saveDAG).mockRejectedValue(new Error('fixture write failed'));
    const wrapper = await editor();
    await click(wrapper, '添加节点');
    await click(wrapper, '保存编排');
    expect(wrapper.text()).toContain('保存未完成，编排草稿已保留');
    expect(wrapper.findAll('.dag-graph-node')).toHaveLength(3);
    expect(pageState().dirty).toBe(true);
  });

  it('旧页保存完成不清除新页草稿 / keeps another page draft dirty when an earlier save completes', async () => {
    let completeSave!: () => void;
    vi.mocked(saveDAG).mockImplementation(
      () =>
        new Promise((resolve) => {
          completeSave = () => resolve(null);
        }),
    );
    const wrapper = await editor();
    const original = pageState();
    await click(wrapper, '添加节点');
    await click(wrapper, '保存编排');
    const previousHash = location.hash;
    try {
      location.hash = '#/DSM/datasource/create';
      pageState().dirty = true;
      completeSave();
      await flushPromises();
      expect(pageState().dirty).toBe(true);
      expect(original.dirty).toBe(false);
    } finally {
      location.hash = previousHash;
    }
  });
});
