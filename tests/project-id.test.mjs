import test from 'node:test';
import assert from 'node:assert/strict';
import {newProjectId,projectIdControl} from '../public/admin/project-id.mjs';
import {cmsConfiguration} from '../lib/cms-config.mjs';
test('project URLs are generated once and existing IDs survive reopening and title edits',()=>{
 const generated=newProjectId(()=> '13cc83cd-0330-4905-98ac-6d84a68bb9c1');
 assert.match(generated,/^project-[a-z0-9-]+$/);
 const control=projectIdControl(x=>x,(tag,props)=>({tag,props}),()=>generated);
 let value='';const instance={props:{value,forID:'project-id',onChange:next=>{value=next;}}};
 control.componentDidMount.call(instance);assert.equal(value,generated);
 instance.props.value=value;instance.props.onChange=()=>assert.fail('An existing ID must not be regenerated');
 control.componentDidMount.call(instance);
 instance.props.value='1-1';control.componentDidMount.call(instance);
 const input=control.render.call(instance);assert.equal(input.props.value,'1-1');assert.equal(input.props.readOnly,true);
 const field=cmsConfiguration({},true).config.collections.find(c=>c.name==='projects').fields.find(f=>f.name==='id');
 assert.equal(field.widget,'project-id');
});
