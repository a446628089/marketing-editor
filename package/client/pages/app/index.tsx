import React, { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Provider } from 'react-redux';
import MaterialPanel from '../../components/editor/MaterialPanel';
import Canvas from '../../components/editor/Canvas';
import PropertyPanel from '../../components/editor/PropertyPanel';
import PreviewPanel from '../../components/preview/PreviewPanel';
import { CONTAINER_TYPES, MATERIALS } from '../../schemas/registry';
import { EditorNodeEntity } from '../../schemas/types';
import { store } from '../../store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addMaterial,
  deleteSelectedNode,
  duplicateSelectedNode,
  loadSchema,
  moveExistingNode,
  redo,
  saveSchema,
  undo,
} from '../../store/editor/slice';
import {
  selectComponents,
  selectHistoryState,
  selectSelectedId,
  selectStatusSummary,
} from '../../store/editor/selectors';
import './style.css';
import 'antd/dist/antd.css';
import hotkeys from 'hotkeys-js';

function countNodes(entities: Record<string, EditorNodeEntity>) {
  return Object.keys(entities).length;
}

function downloadSchema(payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `marketing-editor-schema-${Date.now()}.json`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function EditorWorkspace() {
  const dispatch = useAppDispatch();
  const components = useAppSelector(selectComponents);
  const selectedId = useAppSelector(selectSelectedId);
  const { canUndo, canRedo } = useAppSelector(selectHistoryState);
  const { saveStatus, loadStatus, statusMessage } = useAppSelector(selectStatusSummary);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    dispatch(loadSchema());
  }, [dispatch]);

  useEffect(() => {
    const shouldIgnore = () => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (!activeElement) {
        return false;
      }
      const tagName = activeElement.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || activeElement.isContentEditable;
    };

    hotkeys('command+z,ctrl+z', (event) => {
      if (shouldIgnore()) {
        return;
      }
      event.preventDefault();
      dispatch(undo());
    });

    hotkeys('command+shift+z,ctrl+shift+z', (event) => {
      if (shouldIgnore()) {
        return;
      }
      event.preventDefault();
      dispatch(redo());
    });

    hotkeys('backspace,delete', (event) => {
      if (shouldIgnore()) {
        return;
      }
      event.preventDefault();
      dispatch(deleteSelectedNode());
    });

    hotkeys('command+c,ctrl+c', (event) => {
      if (shouldIgnore()) {
        return;
      }
      event.preventDefault();
      dispatch(duplicateSelectedNode());
    });

    return () => {
      hotkeys.unbind('command+z,ctrl+z');
      hotkeys.unbind('command+shift+z,ctrl+shift+z');
      hotkeys.unbind('backspace,delete');
      hotkeys.unbind('command+c,ctrl+c');
    };
  }, [dispatch]);

  const materialMap = useMemo(
    () => Object.fromEntries(MATERIALS.map((item) => [item.type, item.label])),
    [],
  );

  const stats = useMemo(() => {
    const total = countNodes(components.entities);
    const containers = Object.values(components.entities).filter((node) => node.type === 'container').length;
    const forms = Object.values(components.entities).filter((node) => node.type === 'form').length;
    return { total, containers, forms };
  }, [components.entities]);

  const isSaving = saveStatus === 'saving';
  const isLoading = loadStatus === 'loading';

  const handleSave = () => {
    if (isSaving) {
      return;
    }
    dispatch(saveSchema());
  };

  const handleReload = () => {
    if (isLoading) {
      return;
    }
    dispatch(loadSchema());
  };

  const handleExport = () => {
    downloadSchema({
      components,
      selectedId,
      exportedAt: new Date().toISOString(),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const activeData = event.active.data.current;
    const overData = event.over?.data.current;

    if (!activeData || !event.over || !overData) {
      return;
    }

    const resolveDropTarget = () => {
      if (overData.kind === 'slot') {
        return {
          parentId: (overData.parentId as string | null) ?? null,
          index: overData.index as number,
        };
      }

      if (overData.kind === 'root') {
        return { parentId: null as string | null, index: components.rootIds.length };
      }

      if (overData.kind === 'node') {
        const targetNode = components.entities[overData.nodeId as string];
        if (!targetNode) {
          return null;
        }

        if (CONTAINER_TYPES.includes(targetNode.type)) {
          return { parentId: targetNode.id, index: targetNode.children.length };
        }

        const siblings = targetNode.parentId
          ? components.entities[targetNode.parentId]?.children || []
          : components.rootIds;
        const targetIndex = siblings.findIndex((id) => id === targetNode.id);
        return { parentId: targetNode.parentId, index: targetIndex < 0 ? siblings.length : targetIndex };
      }

      return null;
    };

    const dropTarget = resolveDropTarget();
    if (!dropTarget) {
      return;
    }

    if (activeData.kind === 'material') {
      dispatch(addMaterial({ type: activeData.type, parentId: dropTarget.parentId, index: dropTarget.index }));
      return;
    }

    if (activeData.kind === 'existing-node') {
      const nodeId = activeData.nodeId as string;
      if (nodeId === dropTarget.parentId) {
        return;
      }
      dispatch(moveExistingNode({ nodeId, parentId: dropTarget.parentId, index: dropTarget.index }));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => setActiveDragId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragId(null)}
    >
      <div className='editor-shell'>
        <header className='editor-topbar'>
          <div>
            <div className='editor-topbar__brand'>Marketing Editor · 低代码线上看房平台</div>
            <div className='editor-topbar__subtitle'>营销活动页搭建工作台 · 支持拖拽、配置、预览与快捷操作</div>
          </div>
          <div className='editor-topbar__actions'>
            <div className='editor-topbar__status'>{statusMessage}</div>
            <button className='editor-ghost-button' onClick={handleExport}>
              导出 JSON
            </button>
            <button className='editor-ghost-button' onClick={handleReload} disabled={isLoading}>
              {isLoading ? '加载中...' : '恢复 Schema'}
            </button>
            <button className='editor-primary-button' onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存 Schema'}
            </button>
          </div>
        </header>

        <section className='editor-overview'>
          <OverviewCard label='组件总数' value={String(stats.total)} helper='当前页面已编排节点数' />
          <OverviewCard label='容器数量' value={String(stats.containers)} helper='可承载子组件的布局容器' />
          <OverviewCard label='表单数量' value={String(stats.forms)} helper='支持动态字段配置' />
          <OverviewCard
            label='历史状态'
            value={`${canUndo ? '可撤销' : '已稳定'} / ${canRedo ? '可重做' : '无重做'}`}
            helper='已接入撤销 / 重做记录栈'
          />
        </section>

        <div className='editor-layout'>
          <aside className='editor-sidebar editor-sidebar--left'>
            <MaterialPanel />
          </aside>

          <main className='editor-main'>
            <section className='editor-stage'>
              <Canvas />
            </section>
            <section className='editor-preview'>
              <PreviewPanel />
            </section>
          </main>

          <aside className='editor-sidebar editor-sidebar--right'>
            <PropertyPanel />
            <div className='editor-shortcuts'>
              <div className='panel-title'>编辑效率</div>
              <ul>
                <li>复制：Cmd/Ctrl + C</li>
                <li>删除：Delete / Backspace</li>
                <li>撤销：Cmd/Ctrl + Z</li>
                <li>重做：Cmd/Ctrl + Shift + Z</li>
                <li>保存：顶部「保存 Schema」</li>
                <li>恢复：顶部「恢复 Schema」</li>
                <li>导出：顶部「导出 JSON」</li>
              </ul>
              <div className='editor-selection-tip'>
                {selectedId ? `当前已选中组件：${selectedId}` : '当前未选中组件，可在画布中点击节点进行编辑'}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <DragOverlay>
        {activeDragId?.startsWith('material-') ? (
          <div className='drag-overlay-card'>
            {materialMap[activeDragId.replace('material-', '') as keyof typeof materialMap] || '组件'}
          </div>
        ) : activeDragId ? (
          <div className='drag-overlay-card'>移动组件</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function OverviewCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className='editor-overview-card'>
      <div className='editor-overview-card__label'>{label}</div>
      <div className='editor-overview-card__value'>{value}</div>
      <div className='editor-overview-card__helper'>{helper}</div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <EditorWorkspace />
    </Provider>
  );
}
