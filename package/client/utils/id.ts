let currentId = 1;

export const generateId = (prefix = 'node') => {
  currentId += 1;
  return `${prefix}-${currentId}`;
};

export const generateFieldId = (nodeId: string) => generateId(`${nodeId}-field`);
