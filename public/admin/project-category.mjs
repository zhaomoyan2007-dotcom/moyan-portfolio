// Delegate editing to Decap's select widget. The marker only controls editor visibility;
// irrelevant values remain in the entry, so changing category cannot silently erase them.
export function projectCategoryControl(createClass,h,SelectControl) {
  return createClass({
    render(){
      return h('div',{'data-project-category':this.props.value||''},h(SelectControl,{...this.props}));
    }
  });
}
