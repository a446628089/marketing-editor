export type ComponentType = 'banner' | 'text' | 'form' | 'activity-card' | 'container';

export interface BannerProps {
  title: string;
  description: string;
  imageUrl: string;
  height: number;
  themeColor: string;
}

export interface TextProps {
  text: string;
  color: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface FormField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'phone';
  required: boolean;
}

export interface FormProps {
  title: string;
  buttonText: string;
  fields: FormField[];
}

export interface ActivityCardProps {
  title: string;
  subtitle: string;
  price: string;
  tags: string[];
}

export interface ContainerProps {
  direction: 'vertical' | 'horizontal';
  gap: number;
  padding: number;
  backgroundColor: string;
}

export type ComponentPropsMap = {
  banner: BannerProps;
  text: TextProps;
  form: FormProps;
  'activity-card': ActivityCardProps;
  container: ContainerProps;
};

export type EditorNodeEntity<T extends ComponentType = ComponentType> = {
  [K in T]: {
    id: string;
    type: K;
    name: string;
    parentId: string | null;
    children: string[];
    props: ComponentPropsMap[K];
  };
}[T];

export interface ComponentsState {
  rootIds: string[];
  entities: Record<string, EditorNodeEntity>;
}

export interface HistorySnapshot {
  components: ComponentsState;
  selectedId: string | null;
}
