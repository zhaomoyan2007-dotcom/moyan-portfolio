const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
export function galleryPosition(scrollLeft,offsets){
  if(!offsets.length)return 0;
  return offsets.reduce((best,value,index)=>Math.abs(value-scrollLeft)<Math.abs(offsets[best]-scrollLeft)?index:best,0);
}
export function createGallery({id,images,layout,label,language,makeImage,onOpen}){
  const section=el('div',`photo-gallery layout-${layout}`);section.dataset.gallery=id;
  const track=el('div','photo-track');track.tabIndex=0;track.setAttribute('role','region');track.setAttribute('aria-label',label);
  const isMoving=['carousel','football'].includes(layout);const abort=new AbortController();const {signal}=abort;
  const items=images.map((src,index)=>{
    const button=el('button','gallery-photo');button.type='button';button.setAttribute('aria-label',`${language==='zh'?'放大':'Enlarge'} · ${label} · ${index+1} / ${images.length}`);
    const image=makeImage(src,index);image.draggable=false;
    const ratio=()=>{if(image.naturalWidth&&image.naturalHeight){button.style.setProperty('--photo-ratio',String(image.naturalWidth/image.naturalHeight));image.width=image.naturalWidth;image.height=image.naturalHeight;}update();};
    image.addEventListener('load',ratio,{signal});
    if(layout==='grid')image.sizes='(max-width: 520px) calc((100vw - 64px) / 2), (max-width: 760px) 29vw, 310px';
    button.append(image,el('span','photo-enlarge','＋'));button.lastChild.setAttribute('aria-hidden','true');
    button.onclick=()=>onOpen(images,index,button);track.append(button);return button;
  });
  section.append(track);
  let previous,next,status,frame;
  function update(){
    if(!isMoving||!previous)return;
    previous.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;
    const offsets=items.map(item=>item.offsetLeft);
    status.textContent=`${String(galleryPosition(track.scrollLeft,offsets)+1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  if(isMoving){
    const controls=el('div','gallery-controls');
    status=el('span','gallery-position');status.setAttribute('aria-hidden','true');
    previous=el('button','gallery-arrow','←');next=el('button','gallery-arrow','→');
    previous.type=next.type='button';previous.setAttribute('aria-label',`${label} · ${language==='zh'?'向左浏览':'Scroll left'}`);next.setAttribute('aria-label',`${label} · ${language==='zh'?'向右浏览':'Scroll right'}`);
    const move=direction=>track.scrollBy({left:direction*Math.max(100,track.clientWidth*.75),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    previous.onclick=()=>move(-1);next.onclick=()=>move(1);
    track.addEventListener('keydown',event=>{if(event.target!==track)return;if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}},{signal});
    track.addEventListener('scroll',schedule,{passive:true,signal});
    window.addEventListener('resize',schedule,{passive:true,signal});
    controls.append(status,previous,next);section.append(controls);
    update();schedule();
  }
  return {element:section,destroy(){abort.abort();cancelAnimationFrame(frame);}};
}
export function emptyGallery(layout,count=3){
  const row=el('div',`gallery-empty layout-${layout}`);row.setAttribute('aria-label','待加入作品 / Work to be added');
  for(let i=0;i<count;i++){const cell=el('div','empty-photo');cell.setAttribute('aria-hidden','true');row.append(cell);}
  return row;
}
