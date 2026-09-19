import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MATERIALS } from '../../schemas/registry';
import { ComponentType } from '../../schemas/types';
import './materialPanel.css';

export default function MaterialPanel() {
  return (
    <div className='material-panel'>
      <div className='material-panel__header'>
        <div>
          <div className='panel-title'>物料中心</div>
          <div className='panel-subtitle'>拖入画布快速搭建 Banner、表单、活动模块等营销内容</div>
        </div>
        <div className='material-panel__badge'>5 个组件</div>
      </div>

      <div className='material-panel__group-title'>基础组件</div>
      <div className='material-list'>
        {MATERIALS.map((item) => (
          <MaterialCard key={item.type} type={item.type} label={item.label} description={item.description} />
        ))}
      </div>
    </div>
  );
}

function MaterialCard({
  type,
  label,
  description,
}: {
  type: ComponentType;
  label: string;
  description: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `material-${type}`,
    data: {
      kind: 'material',
      type,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className='material-card'
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      <div className='material-card__meta'>组件</div>
      <div className='material-card__title'>{label}</div>
      <div className='material-card__desc'>{description}</div>
    </div>
  );
}
