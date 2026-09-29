(function(){
var historyStack=["today"],current="today";
var saved=JSON.parse(localStorage.getItem("ibeh-saved")||"[]");
var compareSelected=[];
var productCatalog=[
 {name:"Medit i700",price:7900,tco:10300,value:78},
 {name:"Aoralscan 3",price:6200,tco:8100,value:81},
 {name:"Form 4B",price:6499,tco:14900,value:74},
 {name:"TRIOS 5",price:11900,tco:15400,value:80},
 {name:"Primescan 2",price:13900,tco:17600,value:77},
 {name:"CBCT Pro Demo",price:48500,tco:61200,value:73}
];
var devices=JSON.parse(localStorage.getItem("ibeh-devices")||"[]");

function icons(){if(window.lucide)window.lucide.createIcons({attrs:{"stroke-width":2}})}
function money(n){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n)||0)}
function show(view,push){
  if(!document.querySelector('[data-view="'+view+'"]'))view="today";
  document.querySelectorAll(".app-view").forEach(function(v){v.classList.remove("active")});
  document.querySelector('[data-view="'+view+'"]').classList.add("active");
  document.querySelectorAll("[data-go]").forEach(function(el){el.classList.toggle("active",el.dataset.go===view)});
  current=view;
  var back=document.getElementById("app-back");
  if(back)back.classList.toggle("show",view==="detail");
  if(push!==false&&historyStack[historyStack.length-1]!==view)historyStack.push(view);
  var u=new URL(location.href);if(view==="today")u.searchParams.delete("view");else u.searchParams.set("view",view);history.replaceState({view:view},"",u);
  scrollTo({top:0,behavior:"instant"});
  if(view==="saved")renderSaved();
  if(view==="passport")renderDevices();
  icons();
}
function goBack(){historyStack.pop();show(historyStack.pop()||"today")}
function detail(title,kicker,body,meta){
  meta=meta||{};
  document.getElementById("detail-content").innerHTML='<div class="detail-head"><span class="screen-kicker">'+kicker+'</span><h1>'+title+'</h1><p>'+body+'</p></div><div class="detail-facts"><div><span>Stato</span><b>'+(meta.status||"Demo")+'</b></div><div><span>Fonte</span><b>'+(meta.source||"Da collegare")+'</b></div><div><span>Azione</span><b>'+(meta.action||"Approfondisci prima di decidere")+'</b></div></div><button class="btn primary full detail-save" data-save-title="'+title.replace(/"/g,"&quot;")+'"><i data-lucide="bookmark"></i> Salva</button>';
  show("detail");icons();
}
var details={
"trend-ai":["AI imaging","World Radar","Segnale demo: adozione e integrazioni software in crescita. Il sistema reale mostrerà fonti e data osservazione.",{status:"Scaling · demo",action:"Valuta maturità e compatibilità Italia"}],
"trend-3d":["Chairside 3D printing","World Radar","Segnale demo costruito su crescita vendor, velocità hardware e maturità dei materiali.",{status:"Scaling · demo",action:"Monitora prezzo e casi d'uso"}],
"safety-imaging":["Categoria imaging","Safety Watch","Alert dimostrativo. Il modulo reale mostrerà fonte ufficiale, modello, lotto e azione richiesta.",{status:"Fonte live non collegata",action:"Verifica fonte ufficiale"}]
};

document.addEventListener("click",function(e){
  var g=e.target.closest("[data-go]");if(g){e.preventDefault();show(g.dataset.go);return}
  var d=e.target.closest("[data-detail]");if(d&&details[d.dataset.detail]){var x=details[d.dataset.detail];detail(x[0],x[1],x[2],x[3]);return}
  var p=e.target.closest("[data-product]");
if(p){
  if(e.target.closest(".product-select-toggle")){
    toggleCompare(p.dataset.product);return;
  }
  detail(p.dataset.product,"Prodotto","Prezzo demo "+money(p.dataset.price)+" · TCO demo "+money(p.dataset.tco)+". Nel prodotto finale ogni prezzo avrà fonte, data e configurazione.",{status:"Snapshot demo",action:"Confronta, calcola TCO o apri RFQ"});return
}
  var evSave=e.target.closest(".event-save");if(evSave){e.stopPropagation();var et=evSave.dataset.saveTitle;if(!saved.includes(et))saved.push(et);localStorage.setItem("ibeh-saved",JSON.stringify(saved));evSave.innerHTML='<i data-lucide="check"></i> Salvato';icons();return}
var s=e.target.closest(".detail-save");if(s){var t=s.dataset.saveTitle;if(!saved.includes(t))saved.push(t);localStorage.setItem("ibeh-saved",JSON.stringify(saved));s.innerHTML='<i data-lucide="check"></i> Salvato';icons();return}
  var q=e.target.closest("[data-question]");if(q){answer(q.dataset.question);return}
});
document.getElementById("app-back").addEventListener("click",goBack);

document.getElementById("global-search").addEventListener("keydown",function(e){
 if(e.key!=="Enter")return;var q=this.value.toLowerCase();
 if(q.includes("prevent")||q.includes("offerta"))show("quotes");
 else if(q.includes("ripar")||q.includes("sostitu"))show("repair");
 else if(q.includes("bando")||q.includes("incent"))show("grants");
 else if(q.includes("trend")||q.includes("mercato")||q.includes("italia"))show("radar");
 else if(q.includes("scanner")||q.includes("comprare")||q.includes("prodot"))show("products");
 else {show("ask");document.getElementById("ask-input").value=this.value;answer(this.value)}
});
document.querySelectorAll(".product-row[data-selectable]").forEach(function(r){
  var toggle=document.createElement("button");toggle.type="button";toggle.className="product-select-toggle";toggle.innerHTML='<i data-lucide="plus"></i>';toggle.setAttribute("aria-label","Seleziona per confronto");r.appendChild(toggle);
});
document.getElementById("product-search").addEventListener("input",function(){var q=this.value.toLowerCase();document.querySelectorAll(".product-row").forEach(function(r){r.hidden=!r.innerText.toLowerCase().includes(q)})});
function toggleCompare(name){
  var idx=compareSelected.indexOf(name);if(idx>=0)compareSelected.splice(idx,1);else{if(compareSelected.length>=2)compareSelected.shift();compareSelected.push(name)}
  document.querySelectorAll(".product-row").forEach(function(r){r.classList.toggle("selected",compareSelected.includes(r.dataset.product))});
  var label=document.querySelector("#compare-selection span");if(label)label.textContent=compareSelected.length?compareSelected.join(" + "):"Seleziona 2 prodotti per confrontarli";
  var btn=document.getElementById("open-compare");if(btn)btn.disabled=compareSelected.length<2;icons();
}
document.getElementById("open-compare").addEventListener("click",function(){renderCompare();show("compare")});
function renderCompare(){
  var names=compareSelected.length===2?compareSelected:["Medit i700","Aoralscan 3"];
  var box=document.getElementById("compare-grid");box.innerHTML=names.map(function(n){var p=productCatalog.find(function(x){return x.name===n});return '<div class="compare-card"><span>PRODOTTO</span><h3>'+escapeHtml(p.name)+'</h3><b>'+money(p.price)+'</b><small>Prezzo demo</small><hr><p><strong>TCO</strong> '+money(p.tco)+'</p><p><strong>Indice valore</strong> '+p.value+'/100</p></div>'}).join("");
}

document.getElementById("quote-form").addEventListener("submit",function(e){
 e.preventDefault();var ref=+document.getElementById("quote-product").value,price=+document.getElementById("quote-price").value,extras=+document.getElementById("quote-extras").value,w=+document.getElementById("quote-warranty").value;
 var normalized=Math.max(0,price-extras),diff=normalized-ref,pctDiff=ref?Math.round(diff/ref*100):0;
 var verdict=pctDiff>10?"Prezzo da approfondire":pctDiff<-5?"Prezzo competitivo nella demo":"In linea con il riferimento demo";
 document.getElementById("quote-analysis").innerHTML='<span>'+verdict+'</span><strong>'+money(normalized)+'</strong><small>Prezzo normalizzato · '+(pctDiff>=0?"+":"")+pctDiff+'% vs riferimento demo · garanzia '+w+' anni</small>';
});
document.getElementById("quote-file").addEventListener("change",function(){
 if(!this.files.length)return;
 document.getElementById("quote-result").insertAdjacentHTML("afterbegin",'<div class="upload-note"><i data-lucide="file-check-2"></i><span><b>'+escapeHtml(this.files[0].name)+'</b><small>File selezionato. L’analisi reale non è ancora collegata.</small></span></div>');
 icons();
});
document.getElementById("tco-form").addEventListener("submit",function(e){
 e.preventDefault();var p=+document.getElementById("tco-price").value,y=+document.getElementById("tco-years").value,m=+document.getElementById("tco-maint").value,c=+document.getElementById("tco-cons").value,total=p+y*(m+c);
 document.getElementById("tco-output").innerHTML='<span>TCO '+y+' anni</span><strong>'+money(total)+'</strong><small>'+money(total/y)+' / anno</small>';
});
document.getElementById("rfq-preview").addEventListener("click",function(){
 var suppliers=[...document.querySelectorAll(".supplier:checked")].map(function(x){return x.value});
 var prod=document.getElementById("rfq-product").value;
 document.getElementById("rfq-output").innerHTML=suppliers.length?'<span>RFQ pronta</span><strong>'+prod+'</strong><small>'+suppliers.length+' fornitor'+(suppliers.length===1?'e':'i')+' selezionati. Invio non attivo nella demo.</small>':'<span>Seleziona almeno un fornitore</span>';
});
document.getElementById("repair-form").addEventListener("submit",function(e){
 e.preventDefault();var r=+document.getElementById("repair-cost").value,ry=+document.getElementById("repair-years").value,n=+document.getElementById("replace-cost").value,ny=+document.getElementById("replace-years").value;
 var ra=r/ry,na=n/ny,choice=ra<na?"Riparazione economicamente più leggera":"Sostituzione economicamente più leggera";
 document.getElementById("repair-output").innerHTML='<span>'+choice+'</span><strong>'+money(Math.min(ra,na))+' / anno</strong><small>Riparazione '+money(ra)+'/anno · sostituzione '+money(na)+'/anno. Non include rischio e downtime.</small>';
});
document.getElementById("passport-form").addEventListener("submit",function(e){
 e.preventDefault();var name=document.getElementById("device-name").value.trim(),year=document.getElementById("device-year").value;if(!name||!year)return;
 devices.push({name:name,year:year,status:document.getElementById("device-status").value,maint:document.getElementById("device-maint").value||""});localStorage.setItem("ibeh-devices",JSON.stringify(devices));this.reset();renderDevices();
});
function renderDevices(){
 var box=document.getElementById("device-list");if(!devices.length){box.innerHTML='<div class="empty-inline"><i data-lucide="badge-check"></i><b>Nessun device inserito</b><span>Aggiungi il primo device dello studio.</span></div>'}
 else box.innerHTML=devices.map(function(d){return '<div class="saved-row device-row"><i data-lucide="stethoscope"></i><span><b>'+escapeHtml(d.name)+'</b><small>'+escapeHtml(String(d.year))+' · '+escapeHtml(d.status||'Operativo')+(d.maint?' · manutenzione '+escapeHtml(d.maint):'')+'</small></span></div>'}).join("");
 icons();
}
document.getElementById("benchmark-form").addEventListener("submit",function(e){
 e.preventDefault();var chairs=+document.getElementById("bench-chairs").value,spend=+document.getElementById("bench-spend").value,plan=+document.getElementById("bench-plan").value;
 document.getElementById("benchmark-output").innerHTML='<span>Indicatori interni</span><strong>'+money(spend/chairs)+' / riunito</strong><small>Investimento programmato '+money(plan)+'. Nessun confronto di mercato finché non colleghiamo benchmark reali.</small>';
});
document.getElementById("spend-form").addEventListener("submit",function(e){
 e.preventDefault();var hw=+document.getElementById("spend-hw").value,sw=+document.getElementById("spend-sw").value,m=+document.getElementById("spend-maint").value,t=hw+sw+m;
 document.getElementById("spend-output").innerHTML='<span>Mix di spesa</span><strong>'+money(t)+'</strong><small>Hardware '+pct(hw,t)+' · Software '+pct(sw,t)+' · Assistenza '+pct(m,t)+'</small>';
});
function pct(v,t){return t?Math.round(v/t*100)+"%":"0%"}

function updateItaly(){
 var r=+document.getElementById("italy-readiness").value,c=+document.getElementById("italy-compat").value,p=+document.getElementById("italy-commercial").value,g=+document.getElementById("italy-gap").value;
 document.getElementById("italy-readiness-out").value=r;document.getElementById("italy-compat-out").value=c;document.getElementById("italy-commercial-out").value=p;document.getElementById("italy-gap-out").value=g;
 document.getElementById("italy-score").textContent=Math.round(r*.35+c*.3+p*.25+(100-g)*.1);
}
["italy-readiness","italy-compat","italy-commercial","italy-gap"].forEach(function(id){document.getElementById(id).addEventListener("input",updateItaly)});
updateItaly();

document.querySelectorAll("[data-radar-filter]").forEach(function(btn){btn.addEventListener("click",function(){
 document.querySelectorAll("[data-radar-filter]").forEach(function(x){x.classList.remove("active")});btn.classList.add("active");var f=btn.dataset.radarFilter;
 document.querySelectorAll("[data-view=radar] [data-stage]").forEach(function(card){card.hidden=f!=="all"&&card.dataset.stage!==f});
})});

document.getElementById("grant-form").addEventListener("submit",function(e){
 e.preventDefault();var cat=document.getElementById("grant-category").value,amt=+document.getElementById("grant-amount").value;
 var score=cat==="scanner"?78:cat==="3d"?72:cat==="software"?65:60;
 if(amt>20000)score-=8;
 document.getElementById("grant-output").innerHTML='<span>Matching demo</span><strong>'+Math.max(0,score)+'%</strong><small>Compatibilità simulata con “Attrezzature e digitalizzazione”. Verifica reale non collegata.</small>';
});
document.getElementById("run-safety-check").addEventListener("click",function(){
 var out=document.getElementById("safety-result");
 if(!devices.length){out.innerHTML='<span>Nessun device da controllare</span><strong>0</strong><small>Aggiungi almeno un device nel Device Passport.</small>';return}
 var risky=devices.filter(function(d){return /scan|cbct|imag/i.test(d.name)}).length;
 out.innerHTML='<span>Controllo demo completato</span><strong>'+risky+'</strong><small>'+risky+' potenzial'+(risky===1?'e':'i')+' corrispondenz'+(risky===1?'a':'e')+' con l’alert imaging demo.</small>';
});
document.querySelectorAll("[data-event-filter]").forEach(function(btn){btn.addEventListener("click",function(){
 document.querySelectorAll("[data-event-filter]").forEach(function(x){x.classList.remove("active")});btn.classList.add("active");var f=btn.dataset.eventFilter;
 document.querySelectorAll(".event-card").forEach(function(card){card.hidden=f!=="all"&&card.dataset.eventCategory!==f});
})});

function answer(q){
 q=(q||"").trim();if(!q)return;var l=q.toLowerCase(),out="Posso instradarti verso il modulo giusto.";
 if(l.includes("scanner")||l.includes("comprare"))out='Per un acquisto partirei da <b>Buy Smart</b>: confronta prodotti, poi TCO, preventivo e RFQ.';
 else if(l.includes("prevent"))out='Apri <b>Quote Analyzer</b>: serve a scomporre il preventivo e rendere comparabili le voci.';
 else if(l.includes("ripar")||l.includes("sostitu"))out='Apri <b>Repair vs Replace</b>: confronta il costo annualizzato delle due opzioni.';
 else if(l.includes("trend")||l.includes("italia")||l.includes("mercato"))out='Apri <b>World Radar</b> e poi <b>Italy Next</b> per vedere il passaggio globale → Italia.';
 var stream=document.getElementById("chat-stream");stream.insertAdjacentHTML("beforeend",'<div class="chat-bubble user">'+escapeHtml(q)+'</div><div class="chat-bubble system">'+out+'</div>');stream.scrollTop=stream.scrollHeight;
}
document.getElementById("ask-form").addEventListener("submit",function(e){e.preventDefault();var i=document.getElementById("ask-input");answer(i.value);i.value=""});
function renderSaved(){var box=document.getElementById("saved-list");box.innerHTML=saved.length?saved.map(function(t){return '<div class="saved-row"><i data-lucide="bookmark-check"></i><span>'+escapeHtml(t)+'</span></div>'}).join(""):'<div class="empty-inline"><i data-lucide="bookmark"></i><b>Nessun elemento salvato</b><span>Apri un dettaglio e tocca Salva.</span></div>';icons()}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]})}

renderCompare();var initial=new URLSearchParams(location.search).get("view")||"today";show(initial,false);historyStack=[initial];icons();
})();