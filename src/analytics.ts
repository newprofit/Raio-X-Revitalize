export const eventNames = ['quiz_view','quiz_start','pillar_complete','contact_submit','quiz_complete','result_view','result_cta_click'] as const;
export type EventName = typeof eventNames[number];
// Nenhum identificador, etapa, pilar, texto, UTM ou dado de contato é aceito.
// Sem SDK de anúncios, GTM, Meta, cookies ou envio externo por padrão.
// Um adaptador futuro deve preservar essa lista fechada e exigir revisão de privacidade.
export function track(event:EventName):void {
 if(!eventNames.includes(event) || location.pathname.startsWith('/admin')) return;
 window.dispatchEvent(new CustomEvent('revitalize:analytics',{detail:Object.freeze({event})}));
}
