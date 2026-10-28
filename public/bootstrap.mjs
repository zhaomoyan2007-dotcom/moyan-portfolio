export async function loadPortfolio({document=globalThis.document,fetch=globalThis.fetch}={}) {
  try {
    const raw=document.getElementById('portfolio-data')?.textContent;
    if(raw){
      const data=JSON.parse(raw);
      if(data?.site&&typeof data.site==='object'&&Array.isArray(data.projects))return data;
    }
  } catch { /* An unbuilt or damaged page can still recover from the JSON endpoint. */ }
  const response=await fetch('/content.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('Content unavailable');
  return response.json();
}
