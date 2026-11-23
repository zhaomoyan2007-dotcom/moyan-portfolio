import {filmImages} from '../media.mjs';
import {autoFilmOrder,filmRatio,filmRows,filmRowStyle} from '../film-layout.mjs';

function renderRows(h, ratios, renderFrame) {
  let index = 0;
  return h('div', {className:'film-stills'}, ...filmRows(ratios).map((row, rowIndex) =>
    h('div', {key:rowIndex,className:'film-still-row',style:filmRowStyle(row)}, ...row.columns.map(() => renderFrame(index++)))
  ));
}

export function filmStillsEditor(createClass, h, apply) {
  return createClass({
    getInitialState() { return {ratios:new Map(),selected:null,notice:''}; },
    swap(from, to) {
      const { data, stills } = this.props;
      if (from === null || from === to || from >= stills.length) return;
      const order = stills.map((_, index) => index);
      [order[from], order[to]] = [order[to], order[from]];
      this.setState({selected:null,notice:apply(data, order) ? '已换位，保存后生效。' : ''});
    },
    render() {
      const { data, stills, getAsset, language } = this.props;
      const editable = language === 'zh' && stills.length > 1;
      const { ratios, selected, notice } = this.state;
      const aspects = stills.map(src => ratios.get(src) || 0);
      const ready = aspects.every(Boolean);
      const gallery = renderRows(h, aspects, index => {
        const src = stills[index];
        const label = `${language === 'zh' ? '切片' : 'Still'} ${index + 1}`;
        const image = h('img', {
          src:String(getAsset(src)),alt:label,draggable:false,
          onLoad:event => {
            const ratio = filmRatio(event.currentTarget);
            if (ratio && ratios.get(src) !== ratio) {
              this.setState(state => ({ratios:new Map(state.ratios).set(src, ratio)}));
            }
          }
        });
        const button = editable ? h('button', {
          type:'button',className:'film-still-control',draggable:true,'aria-pressed':selected === index,
          'aria-label':`${label}，选择或拖动换位`,
          onClick:() => {
            if (selected === null || selected === index) this.setState({selected:selected === index ? null : index,notice:''});
            else this.swap(selected, index);
          },
          onDragStart:event => {
            this.dragIndex = index;
            event.dataTransfer.setData('text/plain', String(index));
            event.dataTransfer.effectAllowed = 'move';
            this.setState({selected:index,notice:''});
          },
          onDragOver:event => {
            if (this.dragIndex == null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          },
          onDrop:event => {
            if (this.dragIndex == null) return;
            event.preventDefault();
            const from = this.dragIndex;
            this.dragIndex = null;
            this.swap(from, index);
            this.setState({selected:null});
          },
          onDragEnd:() => { this.dragIndex = null; this.setState({selected:null}); }
        }, image) : image;
        return h('figure', {key:index,className:'film-still'}, button);
      });
      if (!editable) return gallery;
      return h('div', {className:'film-still-editor'},
        h('div', {className:'film-still-toolbar'},
          h('button', {type:'button',disabled:!ready,onClick:() => {
            const order = autoFilmOrder(aspects);
            const changed = apply(data, order);
            this.setState({selected:null,notice:changed ? '已重新排列，保存后生效。' : '当前排布已紧凑。'});
          }}, '一键紧凑排版'),
          h('p', {'aria-live':'polite'}, notice || (selected === null ? '拖动小图换位，也可依次点选两张。' : '选择要交换的另一张图。'))
        ), gallery);
    }
  });
}

export function filmPreview(data,h,getAsset,FilmStills) {
  const {cover,stills}=filmImages(data);
  const languages=['zh','en'].map(language=>{
    const gallery=stills.length ? h(FilmStills,{key:data.id||language,data,stills,getAsset,language}) : null;
    const details=['roles','concept'].flatMap(key=>data[key]?.[language]?.trim()?[
      h('section',{key,className:'film-detail'},h('p',{},data[key][language]))
    ]:[]);
    const project=h('article',{className:'film-project'},
      h('header',{className:'film-project-heading'},h('h3',{},data.title?.[language]||''),
        h('p',{className:'film-date'},data.projectDate||data.year||'')),
      cover?h('figure',{className:'film-cover'},h('img',{src:String(getAsset(cover)),alt:language==='zh'?'短片首图':'Key frame'})):null,
      gallery,
      details.length?h('div',{className:'film-details'},...details):null);
    return h('section',{key:language,lang:language==='zh'?'zh-CN':'en',className:'cms-film-language'},
      h('p',{className:'cms-film-language-label'},language==='zh'?'中文预览':'ENGLISH PREVIEW'),project);
  });
  return h('article',{className:'cms-preview cms-film-preview'},...languages);
}
