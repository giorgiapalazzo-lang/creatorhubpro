(function(){
  var historyStack=["today"];
  var current="today";
  var saved=JSON.parse(localStorage.getItem("ibeh-saved")||"[]");

  function icons(){ if(window.lucide) window.lucide.createIcons({attrs:{"stroke-width":2}}); }
  function setActive(view){
    document.querySelectorAll("[data-go]").forEach(function(el){
      el.classList.toggle("active",el.getAttribute("data-go")===view);
    });
  }
  function show(view,push){
    var target=document.querySelector('[data-view="'+view+'"]');
    if(!target) view="today";
    document.querySelectorAll(".app-view").forEach(function(v){v.classList.remove("active")});
    target=document.querySelector('[data-view="'+view+'"]');
    if(target) target.classList.add("active");
    current=view;
    setActive(view);
    var back=document.getElementById("app-back");
    if(back) back.classList.toggle("show",view==="detail");
    if(push!==false && historyStack[historyStack.length-1]!==view) historyStack.push(view);
    window.scrollTo({top:0,behavior:"instant"});
    var u=new URL(window.location.href);
    if(view==="today") u.searchParams.delete("view"); else u.searchParams.set("view",view);
    history.replaceState({view:view},"",u);
    if(view==="saved") renderSaved();
    icons();
  }
  function goBack(){
    historyStack.pop();
    show(historyStack.pop()||"today");
  }
  function detail(title,kicker,body,meta){
    document.getElementById("detail-content").innerHTML=
      '<div class="detail-head"><span class="screen-kicker">'+kicker+'</span><h1>'+title+'</h1><p>'+body+'</p></div>'+
      '<div class="detail-facts">'+
      '<div><span>Stato</span><b>'+(meta&&meta.status||"Da verificare")+'</b></div>'+
      '<div><span>Fonte</span><b>'+(meta&&meta.source||"Demo / fonte da collegare")+'</b></div>'+
      '<div><span>Azione</span><b>'+(meta&&meta.action||"Apri il contesto prima di decidere")+'</b></div>'+
      '</div>'+
      '<button class="btn primary full detail-save" data-save-title="'+title.replace(/"/g,"&quot;")+'"><i data-lucide="bookmark"></i> Salva</button>';
    show("detail");
    icons();
  }
  var details={
    "safety-imaging":["Safety signal su imaging","Safety Watch","Segnale demo: serve verificare modello, lotto e azione richiesta sulla fonte ufficiale.",{status:"Priorità alta",action:"Verifica i device interessati"}],
    "grant-equipment":["Attrezzature e digitalizzazione","Money Radar","Compatibilità preliminare positiva per alcune categorie di investimento. I requisiti reali vanno verificati prima di agire.",{status:"Da verificare",action:"Controlla requisiti e scadenza"}],
    "grant-training":["Formazione e competenze digitali","Money Radar","Possibile pertinenza per percorsi di aggiornamento del team.",{status:"In valutazione"}],
    "trend-3d":["Chairside 3D printing","World Radar","Il segnale demo combina crescita vendor, velocità hardware e maturità dei materiali.",{status:"Scaling",action:"Monitora prima di investire"}],
    "trend-ai":["AI imaging","World Radar","Adozione e integrazioni software sono in crescita nel dataset demo.",{status:"Scaling"}],
    "trend-remote":["Remote monitoring","World Radar","Segnale interessante per ortodonzia e follow-up; readiness demo 79/100.",{status:"Adoption"}],
    "price-scanners":["Scanner: fascia value","Buy Smart","I prezzi demo mostrano una fascia value più competitiva. Confronta sempre configurazione e TCO.",{status:"Mercato in movimento",action:"Confronta TCO"}]
  };

  document.addEventListener("click",function(e){
    var go=e.target.closest("[data-go]");
    if(go){e.preventDefault();show(go.getAttribute("data-go"));return}
    var d=e.target.closest("[data-detail]");
    if(d){var x=details[d.getAttribute("data-detail")];if(x)detail(x[0],x[1],x[2],x[3]);return}
    var p=e.target.closest("[data-product]");
    if(p){
      detail(p.dataset.product,"Prodotto",
        "Prezzo osservato "+p.dataset.price+" · TCO demo "+p.dataset.tco+". I valori sono illustrativi finché non colleghiamo le fonti reali.",
        {status:"Snapshot demo",action:"Confronta configurazione, assistenza e TCO"});
      return;
    }
    var save=e.target.closest(".detail-save");
    if(save){
      var t=save.getAttribute("data-save-title");
      if(!saved.includes(t)) saved.push(t);
      localStorage.setItem("ibeh-saved",JSON.stringify(saved));
      save.innerHTML='<i data-lucide="check"></i> Salvato'; icons(); return;
    }
    var chip=e.target.closest("[data-filter]");
    if(chip){
      document.querySelectorAll("[data-filter]").forEach(function(c){c.classList.remove("active")});
      chip.classList.add("active");
      var f=chip.dataset.filter;
      document.querySelectorAll(".priority-row").forEach(function(r){r.hidden=f!=="all"&&r.dataset.kind!==f});
      return;
    }
    var pf=e.target.closest("[data-product-filter]");
    if(pf){
      document.querySelectorAll("[data-product-filter]").forEach(function(c){c.classList.remove("active")});
      pf.classList.add("active"); filterProducts(); return;
    }
    var q=e.target.closest("[data-question]");
    if(q){document.getElementById("ask-input").value=q.dataset.question;answer(q.dataset.question);return}
  });

  document.getElementById("app-back").addEventListener("click",goBack);
  document.getElementById("filter-toggle").addEventListener("click",function(){
    var p=document.getElementById("filter-panel"); p.hidden=!p.hidden; icons();
  });
  document.getElementById("product-search").addEventListener("input",filterProducts);
  document.getElementById("global-search").addEventListener("keydown",function(e){
    if(e.key==="Enter"){document.getElementById("product-search").value=this.value;show("products");filterProducts()}
  });
  function filterProducts(){
    var q=(document.getElementById("product-search").value||"").toLowerCase();
    var active=document.querySelector("[data-product-filter].active");
    var cat=active?active.dataset.productFilter:"all";
    document.querySelectorAll(".product-row").forEach(function(r){
      var okCat=cat==="all"||r.dataset.category===cat;
      var okQ=!q||r.innerText.toLowerCase().includes(q);
      r.hidden=!(okCat&&okQ);
    });
  }
  function renderSaved(){
    var box=document.getElementById("saved-list");
    if(!saved.length){box.innerHTML='<div class="empty-inline"><i data-lucide="bookmark"></i><b>Nessun elemento salvato</b><span>Apri un dettaglio e tocca Salva.</span></div>'}
    else box.innerHTML=saved.map(function(t){return '<div class="saved-row"><i data-lucide="bookmark-check"></i><span>'+t+'</span></div>'}).join("");
    icons();
  }
  function answer(q){
    q=(q||"").toLowerCase().trim(); if(!q)return;
    var out="Nella demo non ho trovato una corrispondenza precisa.";
    if(q.includes("scanner")) out="Nel dataset demo: Aoralscan 3 (€6.200) e Medit i700 (€7.900) sono sotto €10.000. Il TCO illustrativo è rispettivamente €8.100 e €10.300.";
    else if(q.includes("bando")||q.includes("attrezz")) out="C'è un'opportunità demo su attrezzature e digitalizzazione. La compatibilità è preliminare: servono verifica requisiti e scadenza.";
    else if(q.includes("3d")||q.includes("printing")) out="Il chairside 3D printing è classificato come 'Scaling' con readiness demo 82/100.";
    var stream=document.getElementById("chat-stream");
    stream.insertAdjacentHTML("beforeend",'<div class="chat-bubble user">'+escapeHtml(q)+'</div><div class="chat-bubble system">'+out+'</div>');
    stream.scrollTop=stream.scrollHeight;
  }
  function escapeHtml(s){return s.replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]})}
  document.getElementById("ask-form").addEventListener("submit",function(e){
    e.preventDefault(); var i=document.getElementById("ask-input"); answer(i.value); i.value="";
  });

  var initial=new URLSearchParams(location.search).get("view")||"today";
  show(initial,false); historyStack=[initial];
  icons();
})();