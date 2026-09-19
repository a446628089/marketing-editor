import { RootState } from '..';

export const selectEditor = (state: RootState) => state.editor;
export const selectComponents = (state: RootState) => state.editor.components;
export const selectRootIds = (state: RootState) => state.editor.components.rootIds;
export const selectEntities = (state: RootState) => state.editor.components.entities;
export const selectSelectedId = (state: RootState) => state.editor.selectedId;
export const selectSelectedNode = (state: RootState) => {
  const selectedId = state.editor.selectedId;
  return selectedId ? state.editor.components.entities[selectedId] || null : null;
};
export const selectHistoryState = (state: RootState) => ({
  canUndo: state.editor.past.length > 0,
  canRedo: state.editor.future.length > 0,
});
export const selectStatusSummary = (state: RootState) => ({
  saveStatus: state.editor.saveStatus,
  loadStatus: state.editor.loadStatus,
  statusMessage: state.editor.statusMessage,
});
