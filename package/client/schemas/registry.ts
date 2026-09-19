import { ComponentPropsMap, ComponentType, EditorNodeEntity } from './types';

const createNode = <T extends ComponentType>(
  id: string,
  type: T,
  name: string,
  props: ComponentPropsMap[T],
): EditorNodeEntity<T> => ({
  id,
  type,
  name,
  parentId: null,
  children: [],
  props,
});

export const MATERIALS: Array<{ type: ComponentType; label: string; description: string }> = [
  { type: 'banner', label: 'Banner 横幅', description: '头图宣传与主标题展示' },
  { type: 'text', label: '文本', description: '承载活动介绍与说明文案' },
  { type: 'form', label: '表单', description: '收集留资信息，支持动态配置字段' },
  { type: 'activity-card', label: '活动卡片', description: '展示优惠活动与卖点' },
  { type: 'container', label: '容器', description: '支持嵌套、分组与布局编排' },
];

export const DEFAULT_NODE_FACTORY: Record<ComponentType, (id: string) => EditorNodeEntity> = {
  banner: (id) =>
    createNode(id, 'banner', 'Banner 组件', {
      title: '春季看房节',
      description: '低门槛在线看房，精选好房一键预约',
      imageUrl: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80',
      height: 220,
      themeColor: '#1677ff',
    }),
  text: (id) =>
    createNode(id, 'text', '文本组件', {
      text: '请输入活动文案，支持实时预览。',
      color: '#1f2937',
      fontSize: 16,
      textAlign: 'left',
    }),
  form: (id) =>
    createNode(id, 'form', '表单组件', {
      title: '领取专属看房礼包',
      buttonText: '立即预约',
      fields: [
        { id: `${id}-name`, label: '姓名', placeholder: '请输入姓名', type: 'text', required: true },
        { id: `${id}-phone`, label: '手机号', placeholder: '请输入手机号', type: 'phone', required: true },
      ],
    }),
  'activity-card': (id) =>
    createNode(id, 'activity-card', '活动卡片', {
      title: '限时特惠房源',
      subtitle: '预约到访可享专属折扣',
      price: '总价 198 万起',
      tags: ['近地铁', '精装交付', '限时折扣'],
    }),
  container: (id) =>
    createNode(id, 'container', '容器组件', {
      direction: 'vertical',
      gap: 16,
      padding: 16,
      backgroundColor: '#f8fafc',
    }),
};

export const CONTAINER_TYPES: ComponentType[] = ['container'];
