export function csvCell(value:unknown):string {
 let text=Array.isArray(value)?value.join(' | '):String(value??'');
 // Bloqueia fórmulas inclusive após espaços, tabs e quebras de linha.
 if(/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
export function makeCsv(rows:Record<string,unknown>[],columns:string[]):string{
 return '\uFEFF'+[columns.map(csvCell).join(';'),...rows.map(row=>columns.map(c=>csvCell(row[c])).join(';'))].join('\r\n');
}
