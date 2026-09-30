export const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export const brand='<a class="brand" href="/" aria-label="Revitalize — início"><span class="brand-mark" aria-hidden="true">r<span>↗</span></span><span>revitalize<span class="brand-sub">IGREJAS SAUDÁVEIS. MISSÃO VIVA.</span></span></a>';
export function shell(content:string,admin=false){return '<header class="site-header"><div class="header-inner">'+brand+'<span class="header-tag">'+(admin?'ÁREA ADMINISTRATIVA':'FERRAMENTA DE DIAGNÓSTICO')+'</span></div></header>'+content+'<footer class="site-footer"><span>Revitalize · Raio-X da igreja</span><div><a href="/privacidade" target="_blank" rel="noopener">Privacidade</a><span>Um olhar atento. Um próximo passo.</span></div></footer>';}
export const arrow='<span aria-hidden="true">↗</span>';
export function status(message:string,error=false){return '<div class="notice '+(error?'error':'')+'" role="'+(error?'alert':'status')+'">'+escapeHtml(message)+'</div>';}
export function date(value:string){return new Date(value).toLocaleString('pt-BR');}
