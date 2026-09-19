import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectComponents, selectSelectedId } from '../../store/editor/selectors';
import { moveNodeByStep, selectNode } from '../../store/editor/slice';
import './layerTree.css';

function TreeNode({ nodeId, depth }: { nodeId: string; depth: number }) {
  const dispatch = useAppDispatch();
  const components = useAppSelector(selectComponents);
  const selectedId = useAppSelector(selectSelectedId);
  const node = components.entities[nodeId];

  if (!node) {
    return null;
  }

  return (
    <div className='layer-tree-node'>
      <div
        className={`layer-tree-node__row ${selectedId === nodeId ? 'is-selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => dispatch(selectNode(nodeId))}
      >
        <div>
          <div className='layer-tree-node__name'>{node.name}</div>
          <div className='layer-tree-node__type'>{node.type}</div>
        </div>
        <div className='layer-tree-node__actions'>
          <button onClick={(event) => {
            event.stopPropagation();
            dispatch(moveNodeByStep({ nodeId, direction: 'up' }));
          }}>↑</button>
          <button onClick={(event) => {
            event.stopPropagation();
            dispatch(moveNodeByStep({ nodeId, direction: 'down' }));
          }}>↓</button>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className='layer-tree-node__children'>
          {node.children.map((childId) => (
            <TreeNode key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LayerTree() {
  const components = useAppSelector(selectComponents);

  return (
    <div className='layer-tree'>
      <div className='layer-tree__header'>
        <div className='panel-title'>图层树</div>
        <div className='panel-subtitle'>查看组件层级，支持快速定位和上下移动</div>
      </div>
      <div className='layer-tree__body'>
        {components.rootIds.map((nodeId) => (
          <TreeNode key={nodeId} nodeId={nodeId} depth={0} />
        ))}
      </div>
    </div>
  );
}
