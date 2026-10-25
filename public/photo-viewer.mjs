import {imageURL} from './media.mjs';
export function createPhotoViewer(dialog,translate){
  const image=dialog.querySelector('.viewer-image'),caption=dialog.querySelector('.viewer-counter'),heading=dialog.querySelector('.viewer-heading');
  const previous=dialog.querySelector('[data-viewer-previous]'),next=dialog.querySelector('[data-viewer-next]'),close=dialog.querySelector('[data-viewer-close]'),error=dialog.querySelector('.viewer-error');
  let photos=[],index=0,trigger,groupKey,touch;
  function render(){
    heading.textContent=translate(groupKey);caption.textContent=`${index+1} / ${photos.length}`;error.hidden=true;
    image.alt=`${translate(groupKey)} · ${index+1}`;image.src=imageURL(photos[index],1800);
    previous.disabled=index===0;next.disabled=index===photos.length-1;
    previous.setAttribute('aria-label',translate('previousPhoto'));next.setAttribute('aria-label',translate('nextPhoto'));close.setAttribute('aria-label',translate('close'));
  }
  function move(step){const target=Math.max(0,Math.min(photos.length-1,index+step));if(target!==index){index=target;render();}}
  previous.onclick=()=>move(-1);next.onclick=()=>move(1);close.onclick=()=>dialog.close();
  image.onerror=()=>{error.textContent=translate('imageError');error.hidden=false;};
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}});
  dialog.addEventListener('touchstart',event=>{touch=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
  dialog.addEventListener('touchend',event=>{if(!touch||event.changedTouches.length!==1)return;const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);},{passive:true});
  dialog.addEventListener('close',()=>{image.removeAttribute('src');photos=[];if(trigger?.isConnected)trigger.focus({preventScroll:true});});
  return {open(list,position,key,source){if(!list.length)return;photos=list;index=position;groupKey=key;trigger=source;render();if(!dialog.open)dialog.showModal();close.focus({preventScroll:true});},refresh(){if(dialog.open)render();}};
}
