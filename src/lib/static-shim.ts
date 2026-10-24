// طبقة الوضع الساكن — تُحقن مرة واحدة في <body> قبل الترطيب.
// تعترض نداءات fetch نحو /api/* وتنفذها محلياً في المتصفح (localStorage)
// بنفس عقود واجهات الخادم حرفياً — تُستخدم في نسخة GitHub Pages التجريبية.

export function buildStaticShim(seedJson: string): string {
  const safeSeed = seedJson.replace(/</g, "\\u003c");
  return `(function(){
"use strict";
var SEED=${safeSeed};
var KEY='mirsal-db-v1';
function load(){
  try{var r=localStorage.getItem(KEY);if(r){var d=JSON.parse(r);if(d&&d.leads&&d.leads.length)return d;}}catch(e){}
  var fresh=JSON.parse(JSON.stringify(SEED));
  try{localStorage.setItem(KEY,JSON.stringify(fresh));}catch(e){}
  return fresh;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){}}
var DB=load();
function J(data,status){return new Response(JSON.stringify(data),{status:status||200,headers:{'content-type':'application/json'}});}
function uid(){return 'st-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);}
function now(){return new Date().toISOString();}
function act(type,text,platform){DB.activity.unshift({id:uid(),type:type,text:text,platform:platform,createdAt:now()});if(DB.activity.length>80)DB.activity.length=80;}

/* ——— محاكاة النشاط الحي ——— */
var FIRST=['ريم','هدى','أسامة','إيمان','سفيان','بشرى','أنيس','وسام','مروة','زكرياء','إيناس','طارق'];
var LAST=['بن يحيى','شعبان','بوعلام','زروقي','مرابط','بن ناصر','عمراني','دحماني','لعروسي','بوزيد'];
var HANDLES=['@reeem.dz','@hoda.style','@osama_barber','@iman.beauty','@sofiane.dz','@bouchra.co','@anis_2026','@wissam.mr','@merva.dz','@zakaria.bna'];
var PLATFORMS=['instagram','facebook','whatsapp','tiktok'];
var SOURCES=['أتمتة «سعر»','أتمتة «حجز»','أتمتة «توصيل»','مراقبة «تجهيزات صالون»','صفحة الالتقاط: عرض الصالونات','واتساب — كاتالوغ'];
var OPENINGS=['السلام عليكم، شحال السعر بلازمنا؟','مرحبا، هذا متوفر؟ 👀','سلام، التوصيل لولاية سطيف كيماش؟','أهلا، عندكم كاتالوغ جديد؟','سلام عليكم، نحب نسقسي على الدفع بالتقسيط','ممكن تفاصيل أكثر على الباك الكامل؟ 🌸'];
var REPLIES=['شكراً، راح نفكر فيها وأرد عليك 👌','ممكن صور للمنتج من قريب؟','واش عنكم من ألوان أخرى؟','تمام، حجزتها! شكراً 🙏','ممكن رقم للتواصل المباشر؟','آخر سؤال: الضمان يشمل ولاية أخرى؟'];
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function simNewLead(){
  var name=pick(FIRST)+' '+pick(LAST);
  var platform=pick(PLATFORMS);
  var withPhone=Math.random()<0.45;
  var source=pick(SOURCES);
  var phone;
  if(withPhone){phone='0'+pick(['5','6','7'])+'xx xx xx xx';var digits=''+Math.floor(10000000+Math.random()*89999999);phone='0'+pick(['5','6','7'])+digits.slice(0,2)+' '+digits.slice(2,4)+' '+digits.slice(4,6)+' '+digits.slice(6,8);}
  var lead={id:uid(),name:name,handle:pick(HANDLES),platform:platform,phone:phone,source:source,status:'new',tags:[],score:40+Math.floor(Math.random()*55),consent:!!withPhone,createdAt:now(),lastActivityAt:now()};
  DB.leads.unshift(lead);
  if(Math.random()<0.7){
    var id=uid();var body=pick(OPENINGS);
    DB.conversations.unshift({id:id,leadId:lead.id,platform:platform,unread:1,lastMessageAt:now(),lastMessagePreview:body});
    DB.messages.push({id:uid(),conversationId:id,direction:'in',body:body,status:'delivered',createdAt:now()});
  }
  act('lead','عميل جديد — '+name+' ('+source+')',platform);
}
function simInbound(convId){
  if(!DB.conversations.length)return;
  var c=convId?DB.conversations.find(function(x){return x.id===convId;}):null;
  c=c||DB.conversations[Math.floor(Math.random()*DB.conversations.length)];
  var body=pick(REPLIES);
  var msg={id:uid(),conversationId:c.id,direction:'in',body:body,status:'delivered',createdAt:now()};
  DB.messages.push(msg);c.unread+=1;c.lastMessageAt=msg.createdAt;c.lastMessagePreview=body;
  var lead=DB.leads.find(function(l){return l.id===c.leadId;});
  if(lead)lead.lastActivityAt=now();
  act('message','رسالة جديدة من '+(lead?lead.name:'عميل'),c.platform);
}
function simMention(){
  var rules=DB.rules.filter(function(r){return r.active;});
  if(!rules.length)return;
  var rule=pick(rules);
  var name=pick(FIRST)+' '+pick(LAST);
  var platform=pick(rule.platforms);
  DB.mentions.unshift({id:uid(),ruleId:rule.id,platform:platform,authorName:name,authorHandle:pick(HANDLES),
    content:pick(['نحب نقترح عليكم '+rule.keyword+' جودة عالية، شكون يرشحلي؟','واش رايكم في '+rule.keyword+' المتوفرة حالياً بالسوق؟','في حاجة لـ '+rule.keyword+' بثمن معقول لهذا الشهر؟ 🙏']),
    url:'#',likes:5+Math.floor(Math.random()*300),comments:2+Math.floor(Math.random()*40),
    sentiment:pick(['positive','neutral','positive','negative']),converted:false,createdAt:now()});
  rule.matchesCount+=1;
  act('mention','ذكر جديد لـ «'+rule.keyword+'»',platform);
}
function auto(){var r=Math.random();if(r<0.45)simNewLead();else if(r<0.85)simInbound();else simMention();}

/* ——— معالجة المسارات ——— */
function handle(path,method,body,query){
  var seg=path.split('/').filter(Boolean);
  var i,p;

  if(path==='stats'&&method==='GET'){
    if(query.live==='1'&&Math.random()<0.22)auto();
    var startOfDay=new Date();startOfDay.setHours(0,0,0,0);
    var newToday=DB.leads.filter(function(l){return new Date(l.createdAt).getTime()>=startOfDay.getTime();}).length;
    var activeConvs=DB.conversations.filter(function(c){return c.unread>0||new Date(c.lastMessageAt).getTime()>Date.now()-86400000;}).length;
    var activeAutomations=DB.automations.filter(function(a){return a.active;}).length;
    var customers=DB.leads.filter(function(l){return l.status==='customer';}).length;
    var days=[];var di;
    for(di=13;di>=0;di--){
      var from=new Date();from.setHours(0,0,0,0);from.setDate(from.getDate()-di);
      var to=from.getTime()+86400000;
      (function(f,t){days.push(DB.leads.filter(function(l){var x=new Date(l.createdAt).getTime();return x>=f&&x<t;}).length);})(from.getTime(),to);
    }
    var order=['instagram','whatsapp','facebook','tiktok','x'];
    var colors={instagram:'#db2777',whatsapp:'#059669',facebook:'#2563eb',tiktok:'#0f172a',x:'#475569'};
    var labels={instagram:'إنستغرام',whatsapp:'واتساب',facebook:'فيسبوك',tiktok:'تيك توك',x:'إكس'};
    var donut=order.map(function(pp){return {label:labels[pp],value:DB.leads.filter(function(l){return l.platform===pp;}).length,color:colors[pp]};}).filter(function(s){return s.value>0;});
    var recent=DB.leads.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).slice(0,6);
    var activity=DB.activity.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}).slice(0,12);
    return J({workspace:DB.workspace,cards:{newToday:newToday,activeConvs:activeConvs,activeAutomations:activeAutomations,conversionRate:DB.leads.length?Math.round(customers/DB.leads.length*100):0,totalLeads:DB.leads.length,unread:DB.conversations.reduce(function(a,c){return a+c.unread;},0)},spark:days,donut:donut,recentLeads:recent,activity:activity});
  }

  if(path==='leads'){
    if(method==='GET')return J({leads:DB.leads.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}),total:DB.leads.length});
    if(method==='POST'){
      if(!body.name)return J({error:'الاسم مطلوب'},400);
      var lead={id:uid(),name:String(body.name).slice(0,80),handle:String(body.handle||'').slice(0,60),platform:body.platform||'instagram',phone:body.phone||undefined,email:body.email||undefined,source:String(body.source||'إضافة يدوية'),status:body.status||'new',tags:Array.isArray(body.tags)?body.tags.slice(0,8):[],score:Number(body.score||50),consent:!!body.consent,notes:body.notes||undefined,createdAt:now(),lastActivityAt:now()};
      DB.leads.unshift(lead);
      act('lead','عميل جديد — '+lead.name+' ('+lead.source+')',lead.platform);
      return J(lead,201);
    }
  }
  if(seg[0]==='leads'&&seg[1]){
    p=DB.leads.find(function(l){return l.id===seg[1];});
    if(method==='PATCH'){
      if(!p)return J({error:'غير موجود'},404);
      if(typeof body.status==='string')p.status=body.status;
      if(typeof body.notes==='string')p.notes=body.notes.slice(0,500);
      if(Array.isArray(body.tags))p.tags=body.tags.slice(0,8);
      if(typeof body.phone==='string'){p.phone=body.phone.slice(0,30)||undefined;if(p.phone)p.consent=true;}
      if(typeof body.score==='number')p.score=Math.max(0,Math.min(100,body.score));
      p.lastActivityAt=now();return J(p);
    }
    if(method==='DELETE'){
      if(!p)return J({error:'غير موجود'},404);
      DB.leads=DB.leads.filter(function(l){return l.id!==p.id;});return J({ok:true});
    }
  }

  if(path==='conversations'&&method==='GET'){
    var convs=DB.conversations.slice().sort(function(a,b){return b.lastMessageAt.localeCompare(a.lastMessageAt);})
      .map(function(c){var lead=DB.leads.find(function(l){return l.id===c.leadId;})||null;var o={};for(var k in c)o[k]=c[k];o.lead=lead;return o;});
    return J({conversations:convs});
  }
  if(seg[0]==='conversations'&&seg[1]){
    var conv=DB.conversations.find(function(c){return c.id===seg[1];});
    if(!conv)return J({error:'غير موجودة'},404);
    if(method==='GET'){
      if(conv.unread>0){conv.unread=0;}
      var lead=DB.leads.find(function(l){return l.id===conv.leadId;})||null;
      var msgs=DB.messages.filter(function(m){return m.conversationId===conv.id;}).sort(function(a,b){return a.createdAt.localeCompare(b.createdAt);});
      return J({conversation:conv,lead:lead,messages:msgs});
    }
    if(method==='POST'){
      var text=String(body.body||'').trim();
      if(!text)return J({error:'نص الرسالة مطلوب'},400);
      var msg={id:uid(),conversationId:conv.id,direction:'out',body:text.slice(0,1000),status:'sent',createdAt:now()};
      DB.messages.push(msg);conv.lastMessageAt=msg.createdAt;conv.lastMessagePreview=msg.body;
      var lead2=DB.leads.find(function(l){return l.id===conv.leadId;});
      if(lead2){lead2.lastActivityAt=msg.createdAt;if(lead2.status==='new')lead2.status='contacted';}
      setTimeout(function(){msg.status='delivered';save();},1200);
      setTimeout(function(){msg.status='read';save();},2600);
      if(Math.random()<0.6)setTimeout(function(){simInbound(conv.id);save();},3000+Math.random()*3000);
      return J(msg,201);
    }
  }

  if(path==='automations'){
    if(method==='GET')return J({automations:DB.automations});
    if(method==='POST'){
      if(!body.name||!body.keyword||!body.replyTemplate)return J({error:'الاسم والكلمة المفتاحية وقالب الرد مطلوبة'},400);
      var a={id:uid(),name:String(body.name).slice(0,80),platform:body.platform||'instagram',trigger:body.trigger||'comment_keyword',keyword:String(body.keyword).slice(0,40),replyTemplate:String(body.replyTemplate).slice(0,600),ctaLink:body.ctaLink||undefined,collectPhone:!!body.collectPhone,active:true,triggeredCount:0,leadsCaptured:0,createdAt:now()};
      DB.automations.unshift(a);
      act('automation','تم إنشاء أتمتة جديدة «'+a.name+'»',a.platform);
      return J(a,201);
    }
  }
  if(seg[0]==='automations'&&seg[1]){
    var au=DB.automations.find(function(x){return x.id===seg[1];});
    if(method==='PATCH'){
      if(!au)return J({error:'غير موجودة'},404);
      ['name','keyword','replyTemplate','ctaLink','platform','trigger'].forEach(function(k){if(typeof body[k]==='string')au[k]=body[k];});
      if(typeof body.active==='boolean')au.active=body.active;
      if(typeof body.collectPhone==='boolean')au.collectPhone=body.collectPhone;
      return J(au);
    }
    if(method==='DELETE'){
      DB.automations=DB.automations.filter(function(x){return x.id!==seg[1];});return J({ok:true});
    }
  }

  if(path==='rules'){
    if(method==='GET')return J({rules:DB.rules});
    if(method==='POST'){
      var kw=String(body.keyword||'').trim();
      if(!kw)return J({error:'الكلمة المفتاحية مطلوبة'},400);
      var rule={id:uid(),keyword:kw.slice(0,40),platforms:(Array.isArray(body.platforms)&&body.platforms.length?body.platforms:['instagram','facebook']),active:true,matchesCount:0,createdAt:now()};
      DB.rules.unshift(rule);return J(rule,201);
    }
  }
  if(seg[0]==='rules'&&seg[1]){
    var rule2=DB.rules.find(function(r){return r.id===seg[1];});
    if(method==='PATCH'){if(!rule2)return J({error:'غير موجودة'},404);if(typeof body.active==='boolean')rule2.active=body.active;return J(rule2);}
    if(method==='DELETE'){DB.rules=DB.rules.filter(function(r){return r.id!==seg[1];});return J({ok:true});}
  }

  if(path==='mentions'&&method==='GET'){
    var ms=DB.mentions.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);})
      .map(function(m){var o={};for(var k in m)o[k]=m[k];o.rule=DB.rules.find(function(r){return r.id===m.ruleId;})||null;return o;});
    return J({mentions:ms,rules:DB.rules});
  }
  if(seg[0]==='mentions'&&seg[2]==='convert'&&method==='POST'){
    var men=DB.mentions.find(function(m){return m.id===seg[1];});
    if(!men)return J({error:'غير موجود'},404);
    if(men.converted)return J({error:'تم التحويل مسبقاً'},409);
    var rule3=DB.rules.find(function(r){return r.id===men.ruleId;});
    var nl={id:uid(),name:men.authorName,handle:men.authorHandle,platform:men.platform,source:'مراقبة «'+(rule3?rule3.keyword:'ذكر')+'»',status:'new',tags:['من المراقبة'],score:55+Math.min(20,Math.floor(men.likes/50)),consent:false,createdAt:now(),lastActivityAt:now()};
    DB.leads.unshift(nl);men.converted=true;
    var cid=uid();
    DB.conversations.unshift({id:cid,leadId:nl.id,platform:men.platform,unread:0,lastMessageAt:now(),lastMessagePreview:'مرحباً! شفتك تبحث… نقدر نساعدك؟'});
    DB.messages.push({id:uid(),conversationId:cid,direction:'out',body:'مرحباً '+men.authorName+' 👋 شفنا تعليقك وتبحث عن حل — نقدر نساعدك؟ أنا هنا لأي سؤال 🌸',status:'sent',createdAt:now()});
    act('lead','تم تحويل ذكر إلى عميل — '+nl.name,men.platform);
    return J(nl,201);
  }

  if(path==='campaigns'){
    if(method==='GET'){
      DB.campaigns.forEach(function(c){
        if(c.status!=='sending')return;
        var step=Math.max(2,Math.round(c.targeted*0.06));
        c.sent=Math.min(c.targeted,c.sent+step);
        c.delivered=Math.min(c.sent,c.delivered+Math.round(step*0.94));
        c.read=Math.min(c.delivered,c.read+Math.round(step*0.75));
        c.replied=Math.min(c.read,c.replied+Math.round(step*0.12));
        if(c.sent>=c.targeted)c.status='sent';
      });
      var tags=[];DB.leads.forEach(function(l){l.tags.forEach(function(t){if(tags.indexOf(t)<0)tags.push(t);});});
      var ac={};tags.forEach(function(t){ac[t]=DB.leads.filter(function(l){return l.tags.indexOf(t)>=0;}).length;});
      return J({campaigns:DB.campaigns.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);}),tags:tags,audienceCount:ac});
    }
    if(method==='POST'){
      if(!body.name||!body.template)return J({error:'الاسم وقالب الرسالة مطلوبان'},400);
      var tag=String(body.audienceTag||'');
      var targeted=tag?DB.leads.filter(function(l){return l.tags.indexOf(tag)>=0&&l.consent;}).length:DB.leads.filter(function(l){return l.consent;}).length;
      var c={id:uid(),name:String(body.name).slice(0,80),channel:'whatsapp',template:String(body.template).slice(0,800),audienceTag:tag,status:body.startNow?'sending':'draft',targeted:targeted,sent:0,delivered:0,read:0,replied:0,createdAt:now()};
      DB.campaigns.unshift(c);
      if(body.startNow)act('campaign','انطلقت حملة «'+c.name+'» — '+targeted+' مستلم بموافقتهم','whatsapp');
      return J(c,201);
    }
  }

  if(path==='capture-pages'){
    if(method==='GET')return J({pages:DB.capturePages.slice().sort(function(a,b){return b.createdAt.localeCompare(a.createdAt);})});
    if(method==='POST'){
      if(!body.title||!body.headline)return J({error:'العنوان والعنوان الفرعي مطلوبان'},400);
      function slugify(s){var b=s.toLowerCase().replace(/[^a-z0-9\\u0600-\\u06FF\\s-]/g,'').trim().replace(/\\s+/g,'-').slice(0,40);return b||'page-'+Math.random().toString(36).slice(2,6);}
      var slug=body.slug?slugify(String(body.slug)):slugify(String(body.title));
      if(DB.capturePages.some(function(pp){return pp.slug===slug;}))slug=slug+'-'+Math.random().toString(36).slice(2,5);
      var page={id:uid(),slug:slug,title:String(body.title).slice(0,80),headline:String(body.headline).slice(0,120),subtext:String(body.subtext||'').slice(0,400),offer:body.offer||undefined,ctaLabel:String(body.ctaLabel||'أرسل بياناتي').slice(0,40),askPhone:body.askPhone!==false,askEmail:!!body.askEmail,published:body.published!==false,views:0,conversions:0,createdAt:now()};
      DB.capturePages.unshift(page);return J(page,201);
    }
  }
  if(seg[0]==='capture-pages'&&seg[1]){
    var pg=DB.capturePages.find(function(x){return x.id===seg[1];});
    if(method==='PATCH'){if(!pg)return J({error:'غير موجودة'},404);if(typeof body.published==='boolean')pg.published=body.published;return J(pg);}
    if(method==='DELETE'){DB.capturePages=DB.capturePages.filter(function(x){return x.id!==seg[1];});return J({ok:true});}
  }

  if(seg[0]==='capture'&&seg[1]){
    var slug2=decodeURIComponent(seg[1]);
    var page2=DB.capturePages.find(function(x){return x.slug===slug2&&x.published;});
    if(!page2)return J({error:'غير متوفرة'},404);
    if(method==='GET'){page2.views+=1;return J({page:page2});}
    if(method==='POST'){
      var name=String(body.name||'').trim();
      if(!name)return J({error:'الاسم مطلوب'},400);
      if(!body.consent)return J({error:'يجب موافقة العميل على التواصل'},400);
      var lead3={id:uid(),name:name.slice(0,80),handle:'',platform:'whatsapp',phone:body.phone||undefined,email:body.email||undefined,source:'صفحة الالتقاط: '+page2.title,status:'new',tags:['صفحة التقاط'],score:page2.askPhone&&body.phone?72:55,consent:true,createdAt:now(),lastActivityAt:now()};
      DB.leads.unshift(lead3);page2.conversions+=1;
      var cid2=uid();
      DB.conversations.unshift({id:cid2,leadId:lead3.id,platform:'whatsapp',unread:0,lastMessageAt:now(),lastMessagePreview:'مرحباً بك! وصلنا طلبك 🌸'});
      DB.messages.push({id:uid(),conversationId:cid2,direction:'out',body:'مرحباً '+lead3.name+' 👋 وصلنا طلبك من «'+page2.title+'» — سنتواصل معك خلال دقائق إن شاء الله 🌸',status:'sent',createdAt:now()});
      act('lead','عميل جديد من صفحة الالتقاط «'+page2.title+'» — '+lead3.name,'whatsapp');
      return J({ok:true},201);
    }
  }

  if(path==='simulate'&&method==='POST'){
    var t=body.type||'auto';
    if(t==='lead')simNewLead();
    else if(t==='message')simInbound(body.conversationId);
    else if(t==='mention')simMention();
    else auto();
    return J({ok:true});
  }

  if(seg[0]==='webhooks'){
    if(method==='GET'&&query['hub.challenge'])return new Response(query['hub.challenge'],{status:200});
    return J({ok:true});
  }

  return J({error:'غير موجود في الوضع الساكن'},404);
}

/* ——— اعتراض fetch ——— */
var _fetch=window.fetch;
window.fetch=function(input,init){
  try{
    var url=typeof input==='string'?input:(input&&input.url)||'';
    var i=url.indexOf('/api/');
    if(i<0)return _fetch.apply(this,arguments);
    var rest=url.slice(i+5);
    var q='';var qi=rest.indexOf('?');
    if(qi>=0){q=rest.slice(qi+1);rest=rest.slice(0,qi);}
    rest=rest.replace(/\\/+$/,'');
    var query={};
    q.split('&').forEach(function(kv){if(kv){var pp=kv.split('=');query[decodeURIComponent(pp[0])]=decodeURIComponent(pp[1]||'');}});
    var method=((init&&init.method)||'GET').toUpperCase();
    var body={};
    try{body=(init&&init.body)?JSON.parse(init.body):{};}catch(e){}
    var res=handle(rest,method,body,query);
    save();
    return Promise.resolve(res);
  }catch(e){
    return _fetch.apply(this,arguments);
  }
};
})();
`;
}
