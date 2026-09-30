import {test,expect, type Page} from '@playwright/test';
async function answerPillar(page:Page,yes=true){
 for(const id of await page.locator('input[data-answer][value="yes"]').evaluateAll(els=>els.map(el=>(el as HTMLInputElement).name))){
 await page.locator('input[name="'+id+'"][value="'+(yes?'yes':'no')+'"]').check();
 }
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
}
async function contact(page:Page){
 await page.getByLabel('Nome',{exact:true}).fill('Teste de interface');
 await page.getByLabel('E-mail',{exact:true}).fill('teste@example.invalid');
 await page.getByRole('combobox',{name:'Função',exact:true}).selectOption('Pastor titular');
 await page.getByRole('combobox',{name:'Tamanho aproximado da igreja',exact:true}).selectOption('Até 50 pessoas');
 await page.getByLabel('Cidade',{exact:true}).fill('Cidade teste');
 await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('SP');
 await page.locator('[name=privacy_consent]').check();
}
test('fluxo completo, recarga, retorno, empate e privacidade',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{(window as any).events=[];window.addEventListener('revitalize:analytics',(event:any)=>(window as any).events.push(event.detail));});
 await page.goto('/?utm_source=teste&utm_campaign=campanha');
 await page.screenshot({path:'test-results/'+testInfo.project.name+'-inicio.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Iniciar diagnóstico'}).click();
 await expect(page.locator('fieldset')).toHaveCount(3);
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Visão',exact:true})).toBeVisible();
 await page.locator('input[name=q1][value=no]').check();
 await page.locator('#comment').fill('Comentário para testar a restauração.');
 await page.reload();
 await page.getByRole('button',{name:'Continuar diagnóstico'}).click();
 await expect(page.locator('input[name=q1][value=no]')).toBeChecked();
 await expect(page.locator('#comment')).toHaveValue('Comentário para testar a restauração.');
 await page.screenshot({path:'test-results/'+testInfo.project.name+'-questionario.png',fullPage:true});
 await answerPillar(page,false);
 await page.getByRole('button',{name:'Voltar'}).click();
 await expect(page.locator('input[name=q1][value=no]')).toBeChecked();
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await answerPillar(page,true);
 await answerPillar(page,true);
 await answerPillar(page,false);
 await answerPillar(page,true);
 await answerPillar(page,true);
 await page.locator('#challenge').fill('Desafio preenchido apenas no teste.');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(page.locator('[name=marketing_consent]')).not.toBeChecked();
 await expect(page.locator('#whatsapp-consent')).toBeHidden();
 await page.locator('#whatsapp').fill('(11) 99999-9999');
 await expect(page.locator('#whatsapp-consent')).toBeVisible();
 await page.locator('[name=whatsapp_consent]').check();
 await page.locator('#whatsapp').fill('');
 await expect(page.locator('[name=whatsapp_consent]')).not.toBeChecked();
 await contact(page);
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('teste@example.invalid');
 await page.getByRole('button',{name:'Ver meu Raio-X'}).click();
 await expect(page.getByRole('heading',{name:'Visão · Discipulado',exact:true})).toBeVisible();
 await expect(page.getByText('Seu principal ponto de atenção parece estar na clareza de visão.',{exact:true})).toBeVisible();
 await expect(page.getByText('Seu principal ponto de atenção parece estar no processo de discipulado.',{exact:true})).toBeVisible();
 await expect(page.locator('.result-card')).toHaveCount(6);
 expect(await page.evaluate(()=>localStorage.getItem('revitalize:draft:v1'))).toBeNull();
 const events=await page.evaluate(()=>(window as any).events);
 expect(events.some((e:any)=>e.event==='quiz_complete')).toBe(true);
 expect(events.every((e:any)=>Object.keys(e).length===1&&typeof e.event==='string')).toBe(true);
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('revitalize:attribution:v1')!).utm_source)).toBe('teste');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/'+testInfo.project.name+'-resultado.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('todas Sim não inventa pilar prioritário',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Iniciar diagnóstico'}).click();
 for(let i=0;i<6;i++)await answerPillar(page);
 await page.locator('#challenge').fill('Manter o acompanhamento.');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await contact(page);await page.getByRole('button',{name:'Ver meu Raio-X'}).click();
 await expect(page.getByRole('heading',{name:'Base consistente nas seis áreas'})).toBeVisible();
 await expect(page.locator('.interpretations article')).toHaveCount(0);
});
test('admin sem conexão não simula dados e rascunho corrompido não quebra',async({page})=>{
 await page.goto('/admin');await expect(page.getByRole('button',{name:'Entrar no painel'})).toBeDisabled();
 await expect(page.locator('table')).toHaveCount(0);
 await page.evaluate(()=>localStorage.setItem('revitalize:draft:v1','{invalid'));
 await page.goto('/');await expect(page.getByRole('button',{name:'Iniciar diagnóstico'})).toBeVisible();
});


test('prévia administrativa vazia mostra layout sem simular cadastros',async({page},testInfo)=>{
 await page.goto('/admin?preview=1');
 await expect(page.getByRole('heading',{name:'Diagnósticos recebidos'})).toBeVisible();
 await expect(page.getByText('Nenhum diagnóstico encontrado para estes filtros.')).toBeVisible();
 await page.getByRole('button',{name:'Exportar CSV'}).click();
 await expect(page.getByText('A exportação ficará disponível com os cadastros reais, após a conexão com o banco.')).toBeVisible();
 await page.screenshot({path:'test-results/'+testInfo.project.name+'-painel.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
