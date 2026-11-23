import { reorderFilmStills } from '../media.mjs';

export function projectImagesEditor(createClass, h, {control, preview, ...options}) {
  let activeControl;
  const Control = createClass({
    componentDidMount() { activeControl = this; },
    componentWillUnmount() {
      if (activeControl === this) activeControl = undefined;
    },
    render() { return h(control, this.props); }
  });

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
