import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectComponents } from '../../store/editor/selectors';
import NodeRenderer from '../editor/NodeRenderer';
import './previewPanel.css';

function PreviewNode({ nodeId }: { nodeId: string }) {
  const components = useAppSelector(selectComponents);
  const node = components.entities[nodeId];

  if (!node) {
    return null;
  }

  return (
    <NodeRenderer node={node} selected={false} preview>
      {node.children.map((childId) => (
        <PreviewNode key={childId} nodeId={childId} />
      ))}
    </NodeRenderer>
  );
}

export default function PreviewPanel() {
  const components = useAppSelector(selectComponents);

  return (
    <div className='preview-panel'>
      <div className='preview-panel__header'>
        <div>
          <div className='panel-title'>实时预览</div>
          <div className='panel-subtitle'>配置变更后即时同步，帮助运营同学快速确认最终展示效果</div>
        </div>
        <div className='preview-panel__badge'>Live</div>
      </div>
      <div className='preview-phone'>
        <div className='preview-phone__header'>Marketing Editor 宣传页</div>
        <div className='preview-phone__body'>
          {components.rootIds.map((nodeId) => (
            <PreviewNode key={nodeId} nodeId={nodeId} />
          ))}
        </div>
      </div>
    </div>
  );
}
