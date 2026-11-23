import { reorderFilmStills } from '../media.mjs';

export function projectImagesEditor({control, preview, ...options}) {
  let activeControl;
  // Decap consults the registered control's update hook for media library selections.
  class Control extends control {
    componentDidMount() {
      super.componentDidMount();
      activeControl = this;
    }
    componentDidUpdate() {
      const { mediaPaths, value, onRemoveInsertedMedia } = this.props;
      const inserted = mediaPaths.get(this.controlID);
      super.componentDidUpdate();
      // A saved list may be a different reference, so acknowledge insertion after applying it.
      if (inserted && inserted !== value) onRemoveInsertedMedia(this.controlID);
    }
    componentWillUnmount() {
      if (activeControl === this) activeControl = undefined;
      super.componentWillUnmount();
    }
  }

  return {
    widget: { ...options, name: 'project-images', controlComponent: Control, previewComponent: preview },
    apply(project, order) {
      if (!activeControl) return false;
      const { value, onChange } = activeControl.props;
      const current = value?.toJS?.() ?? value;
      const expected = typeof project.images === 'string' ? [project.images] : project.images;
      if (!Array.isArray(current) || current.length !== expected?.length ||
          current.some((src, index) => src !== expected[index])) return false;
      const next = reorderFilmStills(project, order);
      if (!next || current.every((src, index) => src === next[index])) return false;
      onChange(next);
      return true;
    }
  };
}
