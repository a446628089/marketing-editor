import React from 'react';
import {
  ActivityCardProps,
  BannerProps,
  ContainerProps,
  EditorNodeEntity,
  FormProps,
  TextProps,
} from '../../schemas/types';
import './nodeRenderer.css';

interface NodeRendererProps {
  node: EditorNodeEntity;
  children?: React.ReactNode;
  selected: boolean;
  preview?: boolean;
  onClick?: () => void;
}

const renderBanner = (props: BannerProps) => (
  <div
    className='node-banner'
    style={{
      backgroundImage: `linear-gradient(135deg, ${props.themeColor}, rgba(15, 23, 42, 0.82)), url(${props.imageUrl})`,
      minHeight: `${props.height}px`,
    }}
  >
    <div className='node-banner__title'>{props.title}</div>
    <div className='node-banner__desc'>{props.description}</div>
  </div>
);

const renderText = (props: TextProps) => (
  <div
    className='node-text'
    style={{
      color: props.color,
      fontSize: `${props.fontSize}px`,
      textAlign: props.textAlign,
    }}
  >
    {props.text}
  </div>
);

const renderForm = (props: FormProps) => (
  <div className='node-form'>
    <div className='node-form__title'>{props.title}</div>
    <div className='node-form__fields'>
      {props.fields.map((field) => (
        <div key={field.id} className='node-form__field'>
          <label>{field.label}</label>
          <input placeholder={field.placeholder} disabled />
        </div>
      ))}
    </div>
    <button className='node-form__button'>{props.buttonText}</button>
  </div>
);

const renderActivityCard = (props: ActivityCardProps) => (
  <div className='node-card'>
    <div className='node-card__title'>{props.title}</div>
    <div className='node-card__subtitle'>{props.subtitle}</div>
    <div className='node-card__price'>{props.price}</div>
    <div className='node-card__tags'>
      {props.tags.map((tag) => (
        <span key={tag} className='node-card__tag'>
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const renderContent = (node: EditorNodeEntity) => {
  switch (node.type) {
    case 'banner':
      return renderBanner(node.props as BannerProps);
    case 'text':
      return renderText(node.props as TextProps);
    case 'form':
      return renderForm(node.props as FormProps);
    case 'activity-card':
      return renderActivityCard(node.props as ActivityCardProps);
    case 'container':
      return null;
    default:
      return null;
  }
};

const getContainerStyle = (props: ContainerProps): React.CSSProperties => ({
  display: 'flex',
  flexDirection: props.direction === 'horizontal' ? 'row' : 'column',
  gap: `${props.gap}px`,
  padding: `${props.padding}px`,
  backgroundColor: props.backgroundColor,
});

export default function NodeRenderer({
  node,
  children,
  selected,
  preview = false,
  onClick,
}: NodeRendererProps) {
  if (node.type === 'container') {
    return (
      <div
        className={`editor-node editor-node--container ${selected ? 'is-selected' : ''} ${preview ? 'is-preview' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
        style={getContainerStyle(node.props as ContainerProps)}
      >
        {!preview && <div className='editor-node__label'>容器</div>}
        {children}
      </div>
    );
  }

  return (
    <div
      className={`editor-node ${selected ? 'is-selected' : ''} ${preview ? 'is-preview' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    >
      {!preview && <div className='editor-node__label'>{node.name}</div>}
      {renderContent(node)}
      {children}
    </div>
  );
}
