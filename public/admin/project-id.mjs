// A project URL is generated once; titles and later edits must never change it.
export function newProjectId(randomUUID=()=>crypto.randomUUID()) {
  return `project-${randomUUID()}`;
}
export function projectIdControl(createClass,h,generate=newProjectId) {
  return createClass({
    componentDidMount(){if(!this.props.value)this.props.onChange(generate());},
    render(){return h('input',{
      id:this.props.forID,className:this.props.classNameWrapper,type:'text',
      value:this.props.value||'',readOnly:true,'aria-label':'自动生成的固定项目地址'
    });}
  });
}
