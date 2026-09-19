import { ComponentsState, EditorNodeEntity, HistorySnapshot } from '../schemas/types';

const cloneNode = (node: EditorNodeEntity): EditorNodeEntity => ({
  ...node,
  props: JSON.parse(JSON.stringify(node.props)),
  children: [...node.children],
});

export const cloneComponents = (components: ComponentsState): ComponentsState => ({
  rootIds: [...components.rootIds],
  entities: Object.fromEntries(
    Object.entries(components.entities).map(([id, node]) => [id, cloneNode(node)]),
  ),
});

export const createSnapshot = (
  components: ComponentsState,
  selectedId: string | null,
): HistorySnapshot => ({
  components: cloneComponents(components),
  selectedId,
});

export const removeNodeTree = (components: ComponentsState, nodeId: string) => {
  const node = components.entities[nodeId];
  if (!node) {
    return;
  }

  node.children.forEach((childId) => removeNodeTree(components, childId));

  if (node.parentId) {
    const parent = components.entities[node.parentId];
    if (parent) {
      parent.children = parent.children.filter((childId) => childId !== nodeId);
    }
  } else {
    components.rootIds = components.rootIds.filter((id) => id !== nodeId);
  }

  delete components.entities[nodeId];
};

export const insertNode = (
  components: ComponentsState,
  node: EditorNodeEntity,
  parentId: string | null,
  index?: number,
) => {
  components.entities[node.id] = node;
  node.parentId = parentId;

  if (parentId) {
    const parent = components.entities[parentId];
    const nextChildren = [...parent.children];
    const targetIndex = typeof index === 'number' ? index : nextChildren.length;
    nextChildren.splice(targetIndex, 0, node.id);
    parent.children = nextChildren;
    return;
  }

  const nextRootIds = [...components.rootIds];
  const targetIndex = typeof index === 'number' ? index : nextRootIds.length;
  nextRootIds.splice(targetIndex, 0, node.id);
  components.rootIds = nextRootIds;
};

export const detachNode = (components: ComponentsState, nodeId: string) => {
  const node = components.entities[nodeId];
  if (!node) {
    return;
  }

  if (node.parentId) {
    const parent = components.entities[node.parentId];
    if (parent) {
      parent.children = parent.children.filter((id) => id !== nodeId);
    }
  } else {
    components.rootIds = components.rootIds.filter((id) => id !== nodeId);
  }
};

export const isAncestorNode = (
  components: ComponentsState,
  ancestorId: string,
  targetParentId: string | null,
): boolean => {
  let currentId = targetParentId;

  while (currentId) {
    if (currentId === ancestorId) {
      return true;
    }
    currentId = components.entities[currentId]?.parentId || null;
  }

  return false;
};

export const moveNode = (
  components: ComponentsState,
  nodeId: string,
  parentId: string | null,
  index?: number,
) => {
  const node = components.entities[nodeId];
  if (!node) {
    return;
  }

  detachNode(components, nodeId);
  insertNode(components, node, parentId, index);
};
