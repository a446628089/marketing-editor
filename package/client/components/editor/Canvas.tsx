import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectNode } from '../../store/editor/slice';
import { selectComponents, selectSelectedId } from '../../store/editor/selectors';
import NodeRenderer from './NodeRenderer';
import { CONTAINER_TYPES } from '../../schemas/registry';
import './canvas.css';

interface DropSlotProps {
  id: string;
  parentId: string | null;
  index: number;
  position: 'before' | 'after' | 'inside';
  label: string;
  compact?: boolean;
}

function DropSlot({ id, parentId, index, position, label, compact = false }: DropSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      kind: 'slot',
      parentId,
      index,
      position,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`canvas-drop-slot canvas-drop-slot--${position} ${compact ? 'is-compact' : ''} ${
        isOver ? 'is-over' : ''
      }`}
    >
      <span>{label}</span>
    </div>
  );
}

function CanvasNode({ nodeId }: { nodeId: string }) {
  const dispatch = useAppDispatch();
  const components = useAppSelector(selectComponents);
  const selectedId = useAppSelector(selectSelectedId);
  const node = components.entities[nodeId];
  const canHaveChildren = node ? CONTAINER_TYPES.includes(node.type) : false;

  const {
    attributes,
    listeners,
    setNodeRef: setDragNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `existing-${nodeId}`,
    data: {
      kind: 'existing-node',
      nodeId,
    },
  });

  if (!node) {
    return null;
  }

  return (
    <div className={`canvas-node-shell ${isDragging ? 'is-dragging' : ''}`}>
      <DropSlot
        id={`slot-before-${nodeId}`}
        parentId={node.parentId}
        index={
          node.parentId
            ? components.entities[node.parentId]?.children.findIndex((childId) => childId === node.id) ?? 0
            : components.rootIds.findIndex((rootId) => rootId === node.id)
        }
        position='before'
        label='插入到此节点前'
        compact
      />

      <div
        ref={setDragNodeRef}
        style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
        {...listeners}
        {...attributes}
      >
        <NodeRenderer
          node={node}
          selected={selectedId === nodeId}
          onClick={() => dispatch(selectNode(nodeId))}
        >
          {canHaveChildren && (
            <DropSlot
              id={`slot-inside-${nodeId}`}
              parentId={node.id}
              index={node.children.length}
              position='inside'
              label={node.children.length > 0 ? '拖到这里添加到容器末尾' : '拖到这里放入容器'}
            />
          )}
          {node.children.map((childId) => (
            <CanvasNode key={childId} nodeId={childId} />
          ))}
        </NodeRenderer>
      </div>

      <DropSlot
        id={`slot-after-${nodeId}`}
        parentId={node.parentId}
        index={
          (node.parentId
            ? components.entities[node.parentId]?.children.findIndex((childId) => childId === node.id) ?? 0
            : components.rootIds.findIndex((rootId) => rootId === node.id)) + 1
        }
        position='after'
        label='插入到此节点后'
        compact
      />
    </div>
  );
}

export default function Canvas() {
  const components = useAppSelector(selectComponents);
  const dispatch = useAppDispatch();

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: {
      kind: 'root',
    },
  });

  return (
    <div className='canvas-wrap'>
      <div className='canvas-header'>
        <div>
          <div className='canvas-header__title'>页面编排画布</div>
          <div className='canvas-header__desc'>拖拽组件进入画布，在这里完成页面结构编排与内容配置</div>
        </div>
        <div className='canvas-header__actions'>
          <div className='canvas-chip'>根节点 {components.rootIds.length}</div>
          <button className='canvas-header__button' onClick={() => dispatch(selectNode(null))}>
            取消选中
          </button>
        </div>
      </div>
      <div className='canvas-surface'>
        <div className='canvas-surface__ruler'>Marketing Editor / 营销活动页 / Editor</div>
        <div ref={setNodeRef} className={`canvas-root ${isOver ? 'is-over' : ''}`}>
          <DropSlot id='slot-root-start' parentId={null} index={0} position='before' label='拖到这里插入页面顶部' />
          {components.rootIds.map((nodeId) => (
            <CanvasNode key={nodeId} nodeId={nodeId} />
          ))}
          <DropSlot
            id='slot-root-end'
            parentId={null}
            index={components.rootIds.length}
            position='after'
            label='拖到这里插入页面底部'
          />
        </div>
      </div>
    </div>
  );
}
