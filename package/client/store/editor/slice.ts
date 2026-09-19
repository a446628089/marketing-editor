import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { DEFAULT_NODE_FACTORY } from '../../schemas/registry';
import { ComponentType, ComponentsState, EditorNodeEntity, FormField, HistorySnapshot } from '../../schemas/types';
import { generateFieldId, generateId } from '../../utils/id';
import { cloneComponents, createSnapshot, insertNode, isAncestorNode, moveNode, removeNodeTree } from '../../utils/tree';

interface EditorSliceState {
  components: ComponentsState;
  selectedId: string | null;
  hoveredId: string | null;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  lastMergeKey: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  loadStatus: 'idle' | 'loading' | 'loaded' | 'error';
  statusMessage: string;
}

const createInitialComponents = (): ComponentsState => {
  const banner = DEFAULT_NODE_FACTORY.banner(generateId('banner'));
  const container = DEFAULT_NODE_FACTORY.container(generateId('container'));
  const text = DEFAULT_NODE_FACTORY.text(generateId('text'));
  const card = DEFAULT_NODE_FACTORY['activity-card'](generateId('card'));
  const form = DEFAULT_NODE_FACTORY.form(generateId('form'));

  container.children = [text.id, card.id];
  text.parentId = container.id;
  card.parentId = container.id;

  return {
    rootIds: [banner.id, container.id, form.id],
    entities: {
      [banner.id]: banner,
      [container.id]: container,
      [text.id]: text,
      [card.id]: card,
      [form.id]: form,
    },
  };
};

const initialState: EditorSliceState = {
  components: createInitialComponents(),
  selectedId: null,
  hoveredId: null,
  past: [],
  future: [],
  lastMergeKey: null,
  saveStatus: 'idle',
  loadStatus: 'idle',
  statusMessage: '工作区已就绪',
};

export const saveSchema = createAsyncThunk('editor/saveSchema', async (_, { getState }) => {
  const state = getState() as { editor: EditorSliceState };
  const response = await axios.post('/api/schema', {
    components: state.editor.components,
    selectedId: state.editor.selectedId,
  });
  return response.data;
});

export const loadSchema = createAsyncThunk('editor/loadSchema', async () => {
  const response = await axios.get('/api/schema');
  return response.data;
});

const pushHistory = (state: EditorSliceState, mergeKey?: string) => {
  if (mergeKey && state.lastMergeKey === mergeKey && state.past.length > 0) {
    state.future = [];
    return;
  }

  state.past.push(createSnapshot(state.components, state.selectedId));
  if (state.past.length > 60) {
    state.past.shift();
  }
  state.future = [];
  state.lastMergeKey = mergeKey || null;
};

const restoreSnapshot = (state: EditorSliceState, snapshot: HistorySnapshot) => {
  state.components = cloneComponents(snapshot.components);
  state.selectedId = snapshot.selectedId;
};

const duplicateTree = (
  sourceId: string,
  state: EditorSliceState,
  nextParentId: string | null,
  targetIndex: number,
) => {
  const source = state.components.entities[sourceId];
  const clonedId = generateId(source.type);
  const clonedNode: EditorNodeEntity = {
    ...source,
    id: clonedId,
    name: `${source.name} 副本`,
    parentId: nextParentId,
    children: [],
    props: JSON.parse(JSON.stringify(source.props)),
  };

  insertNode(state.components, clonedNode, nextParentId, targetIndex);
  clonedNode.children = source.children.map((childId, index) => {
    const nextChildId = duplicateTree(childId, state, clonedId, index);
    return nextChildId;
  });

  return clonedId;
};

const moveNodeStep = (
  state: EditorSliceState,
  payload: { nodeId: string; direction: 'up' | 'down' },
) => {
  const node = state.components.entities[payload.nodeId];
  if (!node) {
    return;
  }

  const siblings = node.parentId
    ? state.components.entities[node.parentId]?.children || []
    : state.components.rootIds;
  const currentIndex = siblings.findIndex((id) => id === payload.nodeId);
  if (currentIndex < 0) {
    return;
  }

  const nextIndex = payload.direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= siblings.length) {
    return;
  }

  pushHistory(state);
  moveNode(state.components, payload.nodeId, node.parentId, nextIndex);
  state.selectedId = payload.nodeId;
  state.lastMergeKey = null;
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    addMaterial(
      state,
      action: PayloadAction<{ type: ComponentType; parentId?: string | null; index?: number }>,
    ) {
      pushHistory(state);
      const id = generateId(action.payload.type);
      const node = DEFAULT_NODE_FACTORY[action.payload.type](id);
      insertNode(state.components, node, action.payload.parentId ?? null, action.payload.index);
      state.selectedId = id;
      state.lastMergeKey = null;
      state.statusMessage = '已新增组件';
    },
    moveExistingNode(
      state,
      action: PayloadAction<{ nodeId: string; parentId: string | null; index?: number }>,
    ) {
      if (!state.components.entities[action.payload.nodeId]) {
        return;
      }
      if (action.payload.parentId && !state.components.entities[action.payload.parentId]) {
        return;
      }
      if (isAncestorNode(state.components, action.payload.nodeId, action.payload.parentId)) {
        return;
      }
      pushHistory(state);
      moveNode(state.components, action.payload.nodeId, action.payload.parentId, action.payload.index);
      state.selectedId = action.payload.nodeId;
      state.lastMergeKey = null;
      state.statusMessage = '组件位置已更新';
    },
    moveNodeByStep(state, action: PayloadAction<{ nodeId: string; direction: 'up' | 'down' }>) {
      moveNodeStep(state, action.payload);
    },
    hydrateSchema(
      state,
      action: PayloadAction<{ components: ComponentsState; selectedId?: string | null; message?: string }>,
    ) {
      state.components = cloneComponents(action.payload.components);
      state.selectedId = action.payload.selectedId ?? null;
      state.past = [];
      state.future = [];
      state.lastMergeKey = null;
      state.statusMessage = action.payload.message || 'Schema 已加载';
    },
    selectNode(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    hoverNode(state, action: PayloadAction<string | null>) {
      state.hoveredId = action.payload;
    },
    updateNodeProps(
      state,
      action: PayloadAction<{ nodeId: string; patch: Record<string, any>; mergeKey?: string }>,
    ) {
      const node = state.components.entities[action.payload.nodeId];
      if (!node) {
        return;
      }
      pushHistory(state, action.payload.mergeKey);
      node.props = {
        ...node.props,
        ...action.payload.patch,
      } as never;
      state.selectedId = action.payload.nodeId;
      state.statusMessage = '组件配置已更新';
    },
    addFormField(state, action: PayloadAction<{ nodeId: string }>) {
      const node = state.components.entities[action.payload.nodeId];
      if (!node || node.type !== 'form') {
        return;
      }
      pushHistory(state);
      const nextField: FormField = {
        id: generateFieldId(node.id),
        label: `字段 ${node.props.fields.length + 1}`,
        placeholder: '请输入内容',
        type: 'text',
        required: false,
      };
      node.props = {
        ...node.props,
        fields: [...node.props.fields, nextField],
      } as never;
      state.selectedId = action.payload.nodeId;
      state.lastMergeKey = null;
      state.statusMessage = '已新增表单项';
    },
    updateFormField(
      state,
      action: PayloadAction<{
        nodeId: string;
        fieldId: string;
        patch: Partial<FormField>;
        mergeKey?: string;
      }>,
    ) {
      const node = state.components.entities[action.payload.nodeId];
      if (!node || node.type !== 'form') {
        return;
      }
      pushHistory(state, action.payload.mergeKey);
      node.props = {
        ...node.props,
        fields: node.props.fields.map((field) =>
          field.id === action.payload.fieldId ? { ...field, ...action.payload.patch } : field,
        ),
      } as never;
      state.selectedId = action.payload.nodeId;
      state.statusMessage = '表单项已更新';
    },
    removeFormField(state, action: PayloadAction<{ nodeId: string; fieldId: string }>) {
      const node = state.components.entities[action.payload.nodeId];
      if (!node || node.type !== 'form' || node.props.fields.length <= 1) {
        return;
      }
      pushHistory(state);
      node.props = {
        ...node.props,
        fields: node.props.fields.filter((field) => field.id !== action.payload.fieldId),
      } as never;
      state.selectedId = action.payload.nodeId;
      state.lastMergeKey = null;
      state.statusMessage = '表单项已删除';
    },
    deleteSelectedNode(state) {
      if (!state.selectedId) {
        return;
      }
      if (!state.components.entities[state.selectedId]) {
        return;
      }
      pushHistory(state);
      removeNodeTree(state.components, state.selectedId);
      state.selectedId = null;
      state.lastMergeKey = null;
      state.statusMessage = '组件已删除';
    },
    duplicateSelectedNode(state) {
      if (!state.selectedId) {
        return;
      }
      const selectedNode = state.components.entities[state.selectedId];
      if (!selectedNode) {
        return;
      }
      pushHistory(state);
      const siblings = selectedNode.parentId
        ? state.components.entities[selectedNode.parentId]?.children || []
        : state.components.rootIds;
      const targetIndex = siblings.findIndex((id) => id === selectedNode.id) + 1;
      const newId = duplicateTree(selectedNode.id, state, selectedNode.parentId, targetIndex);
      state.selectedId = newId;
      state.lastMergeKey = null;
      state.statusMessage = '组件已复制';
    },
    undo(state) {
      const snapshot = state.past.pop();
      if (!snapshot) {
        return;
      }
      state.future.unshift(createSnapshot(state.components, state.selectedId));
      restoreSnapshot(state, snapshot);
      state.lastMergeKey = null;
      state.statusMessage = '已撤销';
    },
    redo(state) {
      const snapshot = state.future.shift();
      if (!snapshot) {
        return;
      }
      state.past.push(createSnapshot(state.components, state.selectedId));
      restoreSnapshot(state, snapshot);
      state.lastMergeKey = null;
      state.statusMessage = '已重做';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSchema.pending, (state) => {
        state.saveStatus = 'saving';
        state.statusMessage = '正在保存 Schema...';
      })
      .addCase(saveSchema.fulfilled, (state) => {
        state.saveStatus = 'saved';
        state.statusMessage = 'Schema 已保存到后台';
      })
      .addCase(saveSchema.rejected, (state) => {
        state.saveStatus = 'error';
        state.statusMessage = 'Schema 保存失败';
      })
      .addCase(loadSchema.pending, (state) => {
        state.loadStatus = 'loading';
        state.statusMessage = '正在加载 Schema...';
      })
      .addCase(loadSchema.fulfilled, (state, action) => {
        if (action.payload?.schema?.components) {
          state.components = cloneComponents(action.payload.schema.components);
          state.selectedId = action.payload.schema.selectedId ?? null;
          state.past = [];
          state.future = [];
          state.lastMergeKey = null;
        }
        state.loadStatus = 'loaded';
        state.statusMessage = action.payload?.schema ? '已从后台恢复 Schema' : '未找到历史 Schema，已加载默认页面';
      })
      .addCase(loadSchema.rejected, (state) => {
        state.loadStatus = 'error';
        state.statusMessage = 'Schema 加载失败，已使用本地默认页面';
      });
  },
});

export const {
  addMaterial,
  moveExistingNode,
  moveNodeByStep,
  hydrateSchema,
  selectNode,
  hoverNode,
  updateNodeProps,
  addFormField,
  updateFormField,
  removeFormField,
  deleteSelectedNode,
  duplicateSelectedNode,
  undo,
  redo,
} = editorSlice.actions;

export default editorSlice.reducer;
