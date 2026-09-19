import React from 'react';
import {
  ActivityCardProps,
  BannerProps,
  ContainerProps,
  FormField,
  FormProps,
  TextProps,
} from '../../schemas/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSelectedNode } from '../../store/editor/selectors';
import { addFormField, removeFormField, updateFormField, updateNodeProps } from '../../store/editor/slice';
import './propertyPanel.css';

const toNumber = (value: string) => Number(value) || 0;
const toTags = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function PropertyPanel() {
  const node = useAppSelector(selectSelectedNode);
  const dispatch = useAppDispatch();

  const updateField = (key: string, value: any) => {
    if (!node) {
      return;
    }

    dispatch(
      updateNodeProps({
        nodeId: node.id,
        patch: { [key]: value },
        mergeKey: `${node.id}-${key}`,
      }),
    );
  };

  const updateCurrentFormField = (fieldId: string, patch: Partial<FormField>, suffix: string) => {
    if (!node || node.type !== 'form') {
      return;
    }

    dispatch(
      updateFormField({
        nodeId: node.id,
        fieldId,
        patch,
        mergeKey: `${node.id}-${fieldId}-${suffix}`,
      }),
    );
  };

  if (!node) {
    return (
      <div className='property-panel'>
        <div className='property-panel__header'>
          <div>
            <div className='panel-title'>属性配置</div>
            <div className='panel-subtitle'>选中组件后可在这里编辑配置</div>
          </div>
        </div>
        <div className='empty-tip'>请先在画布中选中一个组件，系统会根据组件类型自动切换配置项。</div>
      </div>
    );
  }

  const renderFields = () => {
    switch (node.type) {
      case 'banner': {
        const props = node.props as BannerProps;
        return (
          <>
            <Section title='基础信息'>
              <Field label='标题' value={props.title} onChange={(value) => updateField('title', value)} />
              <TextAreaField label='描述' value={props.description} onChange={(value) => updateField('description', value)} />
              <Field label='图片 URL' value={props.imageUrl} onChange={(value) => updateField('imageUrl', value)} />
            </Section>
            <Section title='视觉样式'>
              <Field label='高度' value={String(props.height)} onChange={(value) => updateField('height', toNumber(value))} />
              <Field label='主题色' value={props.themeColor} onChange={(value) => updateField('themeColor', value)} />
            </Section>
          </>
        );
      }
      case 'text': {
        const props = node.props as TextProps;
        return (
          <>
            <Section title='文本内容'>
              <TextAreaField label='文案' value={props.text} onChange={(value) => updateField('text', value)} />
            </Section>
            <Section title='排版样式'>
              <Field label='颜色' value={props.color} onChange={(value) => updateField('color', value)} />
              <Field label='字号' value={String(props.fontSize)} onChange={(value) => updateField('fontSize', toNumber(value))} />
              <SegmentedField
                label='对齐方式'
                value={props.textAlign}
                options={[
                  { label: '左对齐', value: 'left' },
                  { label: '居中', value: 'center' },
                  { label: '右对齐', value: 'right' },
                ]}
                onChange={(value) => updateField('textAlign', value)}
              />
            </Section>
          </>
        );
      }
      case 'form': {
        const props = node.props as FormProps;
        return (
          <>
            <Section title='表单信息'>
              <Field label='标题' value={props.title} onChange={(value) => updateField('title', value)} />
              <Field label='按钮文案' value={props.buttonText} onChange={(value) => updateField('buttonText', value)} />
            </Section>

            <Section
              title='字段配置'
              extra={
                <button className='property-action-button' onClick={() => dispatch(addFormField({ nodeId: node.id }))}>
                  新增表单项
                </button>
              }
            >
              <div className='form-fields-editor'>
                {props.fields.map((field, index) => (
                  <div key={field.id} className='form-field-card'>
                    <div className='form-field-card__header'>
                      <div>
                        <div className='form-field-card__title'>字段 {index + 1}</div>
                        <div className='form-field-card__meta'>{field.type === 'phone' ? '手机号' : '文本输入'}</div>
                      </div>
                      <button
                        className='property-link-button danger'
                        disabled={props.fields.length <= 1}
                        onClick={() => dispatch(removeFormField({ nodeId: node.id, fieldId: field.id }))}
                      >
                        删除
                      </button>
                    </div>

                    <Field
                      label='字段名称'
                      value={field.label}
                      onChange={(value) => updateCurrentFormField(field.id, { label: value }, 'label')}
                    />
                    <Field
                      label='占位文案'
                      value={field.placeholder}
                      onChange={(value) => updateCurrentFormField(field.id, { placeholder: value }, 'placeholder')}
                    />
                    <SelectField
                      label='字段类型'
                      value={field.type}
                      options={[
                        { label: '文本', value: 'text' },
                        { label: '手机号', value: 'phone' },
                      ]}
                      onChange={(value) => updateCurrentFormField(field.id, { type: value as 'text' | 'phone' }, 'type')}
                    />
                    <div className='property-switch-row'>
                      <span>是否必填</span>
                      <button
                        className={`property-toggle ${field.required ? 'is-active' : ''}`}
                        onClick={() => updateCurrentFormField(field.id, { required: !field.required }, 'required')}
                      >
                        {field.required ? '必填' : '选填'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        );
      }
      case 'activity-card': {
        const props = node.props as ActivityCardProps;
        return (
          <Section title='卡片内容'>
            <Field label='标题' value={props.title} onChange={(value) => updateField('title', value)} />
            <Field label='副标题' value={props.subtitle} onChange={(value) => updateField('subtitle', value)} />
            <Field label='价格' value={props.price} onChange={(value) => updateField('price', value)} />
            <Field
              label='标签（逗号分隔）'
              value={props.tags.join(', ')}
              onChange={(value) => updateField('tags', toTags(value))}
            />
          </Section>
        );
      }
      case 'container': {
        const props = node.props as ContainerProps;
        return (
          <Section title='布局容器'>
            <SegmentedField
              label='排列方向'
              value={props.direction}
              options={[
                { label: '纵向', value: 'vertical' },
                { label: '横向', value: 'horizontal' },
              ]}
              onChange={(value) => updateField('direction', value)}
            />
            <Field label='间距' value={String(props.gap)} onChange={(value) => updateField('gap', toNumber(value))} />
            <Field label='内边距' value={String(props.padding)} onChange={(value) => updateField('padding', toNumber(value))} />
            <Field label='背景色' value={props.backgroundColor} onChange={(value) => updateField('backgroundColor', value)} />
          </Section>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className='property-panel'>
      <div className='property-panel__header'>
        <div>
          <div className='panel-title'>属性配置</div>
          <div className='panel-subtitle'>当前选中：{node.name}</div>
        </div>
        <div className='property-node-tag'>{node.type}</div>
      </div>
      {renderFields()}
    </div>
  );
}

function Section({
  title,
  children,
  extra,
}: {
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section className='property-section'>
      <div className='property-section__header'>
        <div className='property-section__title'>{title}</div>
        {extra}
      </div>
      <div className='property-section__body'>{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className='property-field'>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className='property-field'>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className='property-field'>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SegmentedField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className='property-field'>
      <span>{label}</span>
      <div className='property-segmented'>
        {options.map((option) => (
          <button
            key={option.value}
            type='button'
            className={`property-segmented__item ${value === option.value ? 'is-active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
