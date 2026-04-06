// =========== STORAGE ===========
const SK={cats:'pt_cats_v3',cash:'pt_cash_v3',daily:'pt_daily_v3',balHist:'pt_balhist_v3'};
const lsG=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const lsS=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>new Date().toISOString().slice(0,10);
const PAL=['#4d8eff','#2ee8a5','#ffb84d','#ff5c72','#a78bfa','#fb923c','#22d3ee','#f472b6','#818cf8','#38bdf8','#4ade80','#e879f9'];
const CAT_COLORS=['#4d8eff','#2ee8a5','#ffb84d','#a78bfa','#22d3ee','#fb923c','#f472b6','#818cf8'];
const CUM_PROFIT=193822312;

// =========== DEFAULT DATA ===========
const DEFAULT_CATS=[
  {id:'c1',name:'금융투자',color:'#4d8eff',items:[
    {id:'i01',name:'꿈비',init:474468560,bal:405610305},
    {id:'i02',name:'국내대형주',init:401885200,bal:402041600},
    {id:'i03',name:'ISA 계좌',init:70520600,bal:74461025},
    {id:'i04',name:'해외주식',init:435367161,bal:483258860},
    {id:'i05',name:'국내파생',init:44811638,bal:44811638},
    {id:'i06',name:'해외파생',init:111734825,bal:115795979},
    {id:'i07',name:'신한탑픽스',init:200000000,bal:196314204},
    {id:'i08',name:'신한토러스',init:200000000,bal:196297756},
    {id:'i09',name:'채슬리자문형',init:100000000,bal:98771986},
    {id:'i10',name:'신한 IRP',init:14000000,bal:17790361},
    {id:'i11',name:'한투국내위탁',init:300000000,bal:302835318},
    {id:'i12',name:'한투해외위탁',init:300000000,bal:236073378},
    {id:'i13',name:'우리-퇴직연금',init:44024304,bal:51732437},
    {id:'i14',name:'우리-IRP',init:15263978,bal:18660120},
    {id:'i15',name:'미진 절세계좌',init:38000000,bal:38000000}]},
  {id:'c2',name:'부동산투자',color:'#2ee8a5',items:[{id:'i16',name:'현대테라타워',init:520000000,bal:520000000}]},
  {id:'c3',name:'사업투자',color:'#ffb84d',items:[{id:'i17',name:'옥토웍스',init:250000000,bal:250000000}]},
  {id:'c4',name:'지인대여',color:'#a78bfa',items:[{id:'i18',name:'송남영',init:200000000,bal:200000000},{id:'i19',name:'옥토아이앤씨',init:170000000,bal:170000000}]}
];

function getCats(){return lsG(SK.cats)||JSON.parse(JSON.stringify(DEFAULT_CATS))}
function saveCats(c){lsS(SK.cats,c)}
function getCash(){return lsG(SK.cash)||[]}
function saveCash(r){lsS(SK.cash,r)}
function getDaily(){return lsG(SK.daily)||[]}
function saveDaily(r){lsS(SK.daily,r)}
function getBalHist(){return lsG(SK.balHist)||[]}
function saveBalHist(r){lsS(SK.balHist,r)}

// =========== LIVE DATA ===========
function live(){
  const c=JSON.parse(JSON.stringify(getCats()));
  let cashCat=c[0];if(!cashCat)return c;
  let cashItem=null;
  c.forEach(cat=>cat.items.forEach(it=>{if(it.name==='현금')cashItem=it}));
  if(!cashItem){cashItem={id:'i_cash',name:'현금',init:0,bal:0};cashCat.items.push(cashItem)}
  getCash().forEach(tx=>{
    if(tx.isInvestment&&tx.linkedProduct){
      let lk=null;c.forEach(cat=>cat.items.forEach(it=>{if(it.name===tx.linkedProduct)lk=it}));
      if(tx.type==='in'){cashItem.bal+=tx.amount;if(lk)lk.bal-=tx.amount}
      else{cashItem.bal-=tx.amount;if(lk)lk.bal+=tx.amount}
    }else{
      if(tx.type==='in')cashItem.bal+=tx.amount;else cashItem.bal-=tx.amount;
    }
  });
  const hist=getBalHist();
  const latestByItem={};
  hist.forEach(h=>{if(!latestByItem[h.itemId]||h.date>latestByItem[h.itemId].date)latestByItem[h.itemId]=h});
  c.forEach(cat=>cat.items.forEach(it=>{if(latestByItem[it.id])it.bal=latestByItem[it.id].bal}));
  return c;
}

// =========== UTILS ===========
const fmt=n=>{if(n===0)return'0';const a=Math.abs(n);if(a>=1e8)return(n<0?'-':'')+(a/1e8).toFixed(1)+'억';if(a>=1e4)return(n<0?'-':'')+Math.round(a/1e4).toLocaleString()+'만';return n.toLocaleString()};
const ff=n=>n.toLocaleString();
const pct=(a,b)=>b===0?0:((a-b)/b*100);

function getDailyProfit(){
  const hist=getBalHist();if(!hist.length)return 0;
  const cats=getCats();
  const finItems=cats[0]?cats[0].items.filter(x=>x.name!=='현금'&&x.name!=='꿈비'):[];
  const dates=[...new Set(hist.map(h=>h.date))].sort();
  if(dates.length<2){
    const d0=dates[0];const recs=hist.filter(h=>h.date===d0);
    let diff=0;
    recs.forEach(r=>{const it=finItems.find(x=>x.id===r.itemId);if(it)diff+=(r.bal-it.bal)});
    return diff;
  }
  const d1=dates[dates.length-1],d0=dates[dates.length-2];
  const r1=hist.filter(h=>h.date===d1),r0=hist.filter(h=>h.date===d0);
  let t1=0,t0=0;
  finItems.forEach(it=>{
    const a=r1.find(r=>r.itemId===it.id),b=r0.find(r=>r.itemId===it.id);
    t1+=(a?a.bal:it.bal);t0+=(b?b.bal:it.bal);
  });
  return t1-t0;
}

// Compute daily PnL series from balHist (for charts)
function getDailyPnLSeries(){
  const hist=getBalHist();if(!hist.length)return{dates:[],daily:[],monthly:{}};
  const cats=getCats();
  const finItems=cats[0]?cats[0].items.filter(x=>x.name!=='현금'&&x.name!=='꿈비'):[];
  const dates=[...new Set(hist.map(h=>h.date))].sort();
  // Build total per date
  const totals=[];
  dates.forEach(d=>{
    const recs=hist.filter(h=>h.date===d);
    let sum=0;
    finItems.forEach(it=>{const r=recs.find(x=>x.itemId===it.id);sum+=(r?r.bal:it.bal)});
    totals.push({date:d,total:sum});
  });
  // Daily PnL = diff from previous date
  const daily=[];
  for(let i=0;i<totals.length;i++){
    const prev=i>0?totals[i-1].total:totals[i].total;
    daily.push({date:totals[i].date,pnl:totals[i].total-prev});
  }
  // Monthly PnL = sum of daily PnL per month
  const monthly={};
  daily.forEach(d=>{
    const m=d.date.slice(0,7);
    if(!monthly[m])monthly[m]=0;
    monthly[m]+=d.pnl;
  });
  return{dates:daily.map(d=>d.date),daily:daily.map(d=>d.pnl),monthly};
}

// =========== HEADER ===========
document.getElementById('hdrDate').textContent=`${today()} 기준 · 개인 투자 현황`;

// =========== TABS ===========
const TABS=[{id:'fin',label:'금융투자자산'},{id:'futures',label:'선물거래'},{id:'cash',label:'현금 입출금'},{id:'cumul',label:'누적 수익 현황'},{id:'total',label:'전체 투자자산'}];
let curTab='fin';
function renderTabs(){document.getElementById('tabBar').innerHTML=TABS.map(t=>`<div class="tab ${t.id===curTab?'on':''}" onclick="go('${t.id}')">${t.label}</div>`).join('')}
function go(id){curTab=id;renderTabs();render()}

// =========== SUMMARY ===========
function renderSum(){
  const c=live();
  const all=[];c.forEach(cat=>cat.items.forEach(it=>{if(it.init||it.bal)all.push(it)}));
  const ti=all.reduce((s,i)=>s+i.init,0),tb=all.reduce((s,i)=>s+i.bal,0);
  const gg=all.find(x=>x.name==='꿈비');const ggPnl=gg?(gg.bal-gg.init):0;
  const pnl=tb-ti-ggPnl,pp=ti?pct(ti+pnl,ti):0;
  const cashArr=[];c.forEach(cat=>cat.items.forEach(it=>{if(it.name==='현금')cashArr.push(it)}));
  const cashBal=cashArr.length?cashArr[0].bal:0;
  const dailyP=getDailyProfit();
  const cumPp=ti?pct(ti+CUM_PROFIT,ti):0;
  document.getElementById('sumGrid').innerHTML=`
    <div class="sum-card sc1"><div class="sl">총 투자금액</div><div class="sv mono">${ff(ti)}</div><div class="ss" style="color:var(--t3)">${ff(ti)}원</div></div>
    <div class="sum-card sc2"><div class="sl">현재 평가금액</div><div class="sv mono">${ff(tb)}</div><div class="ss ${pnl>=0?'up':'dn'}">${pnl>=0?'▲':'▼'} ${ff(Math.abs(pnl))} (${pp.toFixed(2)}%)</div></div>
    <div class="sum-card sc3"><div class="sl">금일 투자수익</div><div class="sv mono ${dailyP>=0?'up':'dn'}">${dailyP>=0?'+':''}${ff(dailyP)}</div><div class="ss" style="color:var(--t3)">전일 대비 (꿈비 제외)</div></div>
    <div class="sum-card sc4"><div class="sl">누적 투자수익</div><div class="sv mono up">+${ff(CUM_PROFIT)}</div><div class="ss" style="color:var(--t3)">${cumPp.toFixed(2)}% (기초 대비)</div></div>
    <div class="sum-card sc5"><div class="sl">현금 잔액</div><div class="sv mono" style="color:var(--cyan)">${ff(cashBal)}</div><div class="ss" style="color:var(--t3)">입출금 ${getCash().length}건</div></div>`;
}

// =========== RENDER ===========
function render(){renderSum();document.getElementById('mainContent').innerHTML='<div class="pane on" id="paneActive"></div>';({total:rTotal,fin:rFin,futures:rFutures,cash:rCash,cumul:rCumul})[curTab]()}

// =========== 금융투자자산 ===========
function rFin(){
  const cats=getCats();const finCat=cats[0];
  if(!finCat){document.getElementById('paneActive').innerHTML='<div class="em">금융투자 카테고리가 없습니다.</div>';return}
  const items=finCat.items.filter(x=>x.name!=='현금'&&(x.init||x.bal));
  const hist=getBalHist();
  const liveC=live();
  const liveItems=liveC[0]?liveC[0].items.filter(x=>x.name!=='현금'&&(x.init||x.bal)):[];

  let h=`
    <div class="nb">📊 <b>금융투자 상품별 일별 잔액</b>을 아래 테이블에서 한번에 입력합니다.<br>
    <b>전일금액 불러오기</b>를 누르면 마지막 기록된 금액이 자동으로 채워집니다. 변경된 상품만 수정 후 저장하세요.</div>
    <div class="tw"><div class="ch"><div class="cd" style="background:var(--blue)"></div>일별 잔액 입력
      <span style="margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <input type="date" id="batchDate" value="${today()}" style="padding:6px 10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--t1);font-size:12px;font-family:'DM Mono',monospace">
        <button class="btn bo2" style="padding:6px 14px;font-size:11px" onclick="loadPrevDay()">📋 전일금액 불러오기</button>
        <button class="btn bp" style="padding:6px 14px;font-size:11px" onclick="saveBatch()">💾 일괄 저장</button>
      </span></div>
    <div class="tbl-scroll"><table><thead><tr><th>#</th><th>상품명</th><th style="text-align:right">현재(최종) 잔액</th><th style="text-align:right">금일 잔액 입력</th><th style="text-align:right">변동액</th></tr></thead><tbody>`;
  items.forEach((it,i)=>{
    const liveIt=liveItems.find(x=>x.id===it.id);const curBal=liveIt?liveIt.bal:it.bal;
    h+=`<tr class="batch-row"><td>${i+1}</td><td>${it.name}</td><td class="am">${ff(curBal)}</td>
      <td><input type="text" class="batch-inp" id="batch_${it.id}" data-id="${it.id}" data-cur="${curBal}" placeholder="금액 입력" oninput="onBatchInput(this)"></td>
      <td class="am" id="diff_${it.id}" style="color:var(--t3)">-</td></tr>`;
  });
  h+=`</tbody></table></div>`;

  // ===== 기준일 대비 손익변동표 (기준일 선택 가능) =====
  const histDates=[...new Set(hist.map(x=>x.date))].sort();
  const baseOpts=`<option value="init">기초금액 (최초)</option>${histDates.map(d=>`<option value="${d}">${d}</option>`).join('')}`;
  h+=`<div class="tw"><div class="ch"><div class="cd" style="background:var(--amber)"></div>기준일 대비 손익변동표
    <span style="margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--t3);font-weight:400">기준일:</span>
      <select id="baseSelect" onchange="renderPnlTable()" style="padding:5px 10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--t1);font-size:11px;font-family:'DM Mono',monospace">${baseOpts}</select>
    </span></div>
    <div id="pnlTableBody"></div></div>`;

  // ===== 일별 손익 변화 그래프 =====
  h+=`<div class="cg">
    <div class="cc"><div class="ct"><div class="cd" style="background:var(--blue)"></div>일별 손익 변화</div><canvas id="dailyPnlChart" height="240"></canvas></div>
    <div class="cc"><div class="ct"><div class="cd" style="background:var(--green)"></div>월별 손익 변화</div><canvas id="monthlyPnlChart" height="240"></canvas></div>
  </div>`;

  // History log
  const sortedHist=[...hist].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  if(sortedHist.length){
    h+=`<div class="tw"><div class="ch"><div class="cd" style="background:var(--purple)"></div>잔액 기록 이력 <span style="margin-left:auto;font-size:11px;color:var(--t3)">${sortedHist.length}건</span></div>
      <div class="tbl-scroll"><table><thead><tr><th>날짜</th><th>상품명</th><th>잔액</th><th>메모</th><th></th></tr></thead><tbody>`;
    sortedHist.slice(0,50).forEach(r=>{
      h+=`<tr><td style="text-align:left" class="am">${r.date}</td><td style="text-align:left">${findItemName(r.itemId)}</td>
        <td class="am">${ff(r.bal)}</td><td style="text-align:left;color:var(--t3);font-size:11px">${r.memo||''}</td>
        <td><button class="btn bd" style="padding:4px 10px;font-size:10px" onclick="delBalHist('${r.id}')">삭제</button></td></tr>`;
    });
    h+='</tbody></table></div>';
  }

  document.getElementById('paneActive').innerHTML=h;
  setTimeout(()=>{renderPnlTable();drawDailyPnlChart();drawMonthlyPnlChart()},50);
}

function findItemName(itemId){let name='?';getCats().forEach(c=>c.items.forEach(it=>{if(it.id===itemId)name=it.name}));return name}

// ===== CHART: Daily PnL Bar =====
function drawDailyPnlChart(){
  const cv=document.getElementById('dailyPnlChart');if(!cv)return;
  const {dates,daily}=getDailyPnLSeries();
  if(dates.length<2){cv.parentElement.innerHTML+='<div class="em" style="padding:20px">일별 기록이 2건 이상 필요합니다.</div>';return}
  // Skip first entry (always 0)
  const ds=dates.slice(1),vs=daily.slice(1);
  if(!vs.length)return;
  const ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,rect=cv.getBoundingClientRect();
  cv.width=rect.width*dpr;cv.height=240*dpr;ctx.scale(dpr,dpr);
  const W=rect.width,H=240;
  const mx=Math.max(...vs.map(Math.abs),1);
  const pad={t:20,b:45,l:10,r:10},bA=W-pad.l-pad.r;
  const bW=Math.min(bA/vs.length*.7,30),gap=(bA-bW*vs.length)/(vs.length+1);
  const cH=H-pad.t-pad.b,zY=pad.t+cH/2;
  ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pad.l,zY);ctx.lineTo(W-pad.r,zY);ctx.stroke();
  vs.forEach((v,i)=>{
    const x=pad.l+gap*(i+1)+bW*i,h2=Math.abs(v)/mx*(cH/2-8),y=v>=0?zY-h2:zY;
    const co=v>=0?'#2ee8a5':'#ff5c72';
    ctx.fillStyle=co;rr(ctx,x,y,bW,h2,2);ctx.fill();
    if(vs.length<=20){ctx.fillStyle=co;ctx.font='500 8px DM Mono';ctx.textAlign='center';ctx.fillText((v>=0?'+':'')+fmt(v),x+bW/2,v>=0?y-4:y+h2+10)}
    ctx.save();ctx.translate(x+bW/2,H-pad.b+8);ctx.rotate(-Math.PI/4);
    ctx.fillStyle='#516480';ctx.font='9px DM Mono';ctx.textAlign='right';ctx.fillText(ds[i].slice(5),0,0);ctx.restore();
  });
}

// ===== CHART: Monthly PnL Bar =====
function drawMonthlyPnlChart(){
  const cv=document.getElementById('monthlyPnlChart');if(!cv)return;
  const {monthly}=getDailyPnLSeries();
  const months=Object.keys(monthly).sort();
  const vs=months.map(m=>monthly[m]);
  if(!months.length){cv.parentElement.innerHTML+='<div class="em" style="padding:20px">월별 데이터가 없습니다.</div>';return}
  const ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,rect=cv.getBoundingClientRect();
  cv.width=rect.width*dpr;cv.height=240*dpr;ctx.scale(dpr,dpr);
  const W=rect.width,H=240;
  const mx=Math.max(...vs.map(Math.abs),1);
  const pad={t:20,b:40,l:10,r:10},bA=W-pad.l-pad.r;
  const bW=Math.min(bA/vs.length*.6,50),gap=(bA-bW*vs.length)/(vs.length+1);
  const cH=H-pad.t-pad.b,zY=pad.t+cH/2;
  ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pad.l,zY);ctx.lineTo(W-pad.r,zY);ctx.stroke();
  vs.forEach((v,i)=>{
    const x=pad.l+gap*(i+1)+bW*i,h2=Math.abs(v)/mx*(cH/2-8),y=v>=0?zY-h2:zY;
    const co=v>=0?'#2ee8a5':'#ff5c72';
    ctx.fillStyle=co;rr(ctx,x,y,bW,h2,3);ctx.fill();
    ctx.fillStyle=co;ctx.font='500 9px DM Mono';ctx.textAlign='center';
    ctx.fillText((v>=0?'+':'')+fmt(v),x+bW/2,v>=0?y-5:y+h2+12);
    ctx.fillStyle='#8fa3c0';ctx.font='10px Noto Sans KR';ctx.textAlign='center';
    ctx.fillText(months[i].slice(2).replace('-','/'),x+bW/2,H-pad.b+14);
  });
}

function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath()}

// Batch input handlers
function onBatchInput(el){
  const raw=el.value.replace(/,/g,''),num=parseInt(raw),cur=parseInt(el.dataset.cur);
  const diffEl=document.getElementById('diff_'+el.dataset.id);
  if(!isNaN(num)){const d=num-cur;diffEl.innerHTML=`<span class="${d>=0?'up':'dn'}">${d>=0?'+':''}${ff(d)}</span>`;
    if(num!==cur)el.classList.add('batch-changed');else el.classList.remove('batch-changed');
  }else{diffEl.innerHTML='-';el.classList.remove('batch-changed')}
}
function loadPrevDay(){
  const cats=getCats(),finCat=cats[0];if(!finCat)return;
  const items=finCat.items.filter(x=>x.name!=="현금"&&(x.init||x.bal));
  const hist=getBalHist();
  const latestByItem={};
  hist.forEach(r=>{if(!latestByItem[r.itemId]||r.date>latestByItem[r.itemId].date)latestByItem[r.itemId]=r});
  let filled=0;let usedDates=new Set();
  items.forEach(it=>{
    const inp=document.getElementById('batch_'+it.id);if(!inp)return;
    const rec=latestByItem[it.id];
    if(rec){
      inp.value=it.bal.toLocaleString();usedDates.add(rec.date);
    }else{
      inp.value=it.bal.toLocaleString();usedDates.add('기초값');
    }
    filled++;
    const raw=inp.value.replace(/,/g,'');
    const num=parseInt(raw);
    const cur=parseInt(inp.dataset.cur);
    const diffEl=document.getElementById('diff_'+inp.dataset.id);
    if(!isNaN(num)&&diffEl){
      const d2=num-cur;
      diffEl.innerHTML='<span class="'+(d2>=0?'up':'dn')+'">'+(d2>=0?'+':'')+d2.toLocaleString()+'</span>';
    }
  });
  const dateInfo=[...usedDates].sort().join(', ');
  alert(filled+'개 상품 금액을 불러왔습니다. (기준: '+dateInfo+') 변경이 필요한 상품만 수정 후 저장하세요.');
}
function saveBatch(){
  const date=document.getElementById('batchDate').value;if(!date){alert('날짜를 선택하세요.');return}
  const cats=getCats(),finCat=cats[0];if(!finCat)return;
  const items=finCat.items.filter(x=>x.name!=='현금'&&(x.init||x.bal));
  const h2=getBalHist(),d=getDaily();let count=0;
  items.forEach(it=>{const inp=document.getElementById('batch_'+it.id);if(!inp||!inp.value)return;
    const num=parseInt(inp.value.replace(/,/g,''));if(isNaN(num))return;
    h2.push({id:uid(),date,itemId:it.id,bal:num,memo:''});d.push({id:uid(),date,product:it.name,bal:num,memo:''});count++});
  if(!count){alert('입력된 금액이 없습니다.');return}
  saveBalHist(h2);saveDaily(d);alert(`${date} 기준 ${count}개 상품 잔액이 저장되었습니다.`);render();
}
function delBalHist(id){if(!confirm('이 기록을 삭제하시겠습니까?'))return;saveBalHist(getBalHist().filter(r=>r.id!==id));render()}

// Render PnL table with selectable base date
function renderPnlTable(){
  const sel=document.getElementById('baseSelect');
  const baseVal=sel?sel.value:'init';
  const hist=getBalHist();
  const liveC=live();
  const liveItems=liveC[0]?liveC[0].items.filter(x=>x.name!=='현금'&&(x.init||x.bal)):[];
  const baseRecs=baseVal!=='init'?hist.filter(h=>h.date===baseVal):[];
  let tbl='<div class="tbl-scroll"><table><thead><tr><th>#</th><th>상품명</th><th>기준금액</th><th>현재잔액</th><th>손익(원)</th><th>수익률</th></tr></thead><tbody>';
  let tI=0,tB=0;
  liveItems.forEach((it,i)=>{
    let baseAmt=it.init;
    if(baseVal!=='init'){const br=baseRecs.find(r=>r.itemId===it.id);if(br)baseAmt=br.bal;}
    const pnl2=it.bal-baseAmt,p2=baseAmt?pct(it.bal,baseAmt):0;
    tI+=baseAmt;tB+=it.bal;
    const isGg=it.name==='꿈비';
    tbl+=`<tr${isGg?' style="opacity:.5"':''}><td>${i+1}</td><td>${it.name}${isGg?' <span style="font-size:9px;color:var(--t3)">(제외)</span>':''}</td>
      <td class="am">${ff(baseAmt)}</td><td class="am">${ff(it.bal)}</td>
      <td class="am ${pnl2>=0?'up':'dn'}">${pnl2>=0?'+':''}${ff(pnl2)}</td>
      <td class="am ${p2>=0?'up':'dn'}">${baseAmt?(p2>=0?'+':'')+p2.toFixed(2)+'%':'-'}</td></tr>`;
  });
  const tp=tB-tI,tpp=tI?pct(tB,tI):0;
  tbl+=`<tr class="fr"><td></td><td>합계</td><td class="am">${ff(tI)}</td><td class="am">${ff(tB)}</td>
    <td class="am ${tp>=0?'up':'dn'}">${tp>=0?'+':''}${ff(tp)}</td>
    <td class="am ${tpp>=0?'up':'dn'}">${tpp>=0?'+':''}${tpp.toFixed(2)}%</td></tr>`;
  tbl+='</tbody></table></div>';
  document.getElementById('pnlTableBody').innerHTML=tbl;
}


// =========== 선물거래 ===========
const SK_FUT='pt_futures_v1';
const DEFAULT_FUT={
  fxRate:1505.8,
  budget:200000000,
  stopLoss:50000000,
  cash:200000000,
  positions:[
    {id:'f01',name:'USDKRW',cat:'FX',date:'2026-02-10',contracts:0,entry:1447.6,mkt:1505.8,pos:0,mult:12500000,ccy:'KRW'},
    {id:'f02',name:'JY (엔선물)',cat:'FX',date:'2026-01-01',contracts:0,entry:6971,mkt:6415.5,pos:0,mult:12500000,ccy:'KRW'},
    {id:'f03',name:'EUR (유로)',cat:'FX',date:'2026-01-01',contracts:0,entry:1.16285,mkt:1.1662,pos:0,mult:125000,ccy:'USD'},
    {id:'f04',name:'KTB 3년',cat:'Bond',date:'2026-02-20',contracts:0,entry:105.41,mkt:105.54,pos:0,mult:1000000,ccy:'KRW'},
    {id:'f05',name:'KTB 10년',cat:'Bond',date:'2026-02-20',contracts:0,entry:111.89,mkt:112.85,pos:0,mult:1000000,ccy:'KRW'},
    {id:'f06',name:'US Treasury 10Y (ZN)',cat:'Bond',date:'2026-02-23',contracts:-2,entry:113.2125,mkt:110.96875,pos:-2,mult:1000,ccy:'USD'},
    {id:'f07',name:'KOSPI200',cat:'EQ',date:'2026-04-03',contracts:1,entry:775,mkt:799.3,pos:1,mult:250000,ccy:'KRW'},
    {id:'f08',name:'KQ150',cat:'EQ',date:'2026-02-20',contracts:0,entry:2025.1,mkt:2059.3,pos:0,mult:10000,ccy:'KRW'},
    {id:'f09',name:'Micro Nasdaq (MNQ)',cat:'EQ',date:'2026-03-12',contracts:2,entry:25006,mkt:24155.75,pos:2,mult:2,ccy:'USD'},
    {id:'f10',name:'Micro S&P (MES)',cat:'EQ',date:'2026-03-22',contracts:4,entry:6775.25,mkt:6607.25,pos:4,mult:5,ccy:'USD'},
    {id:'f11',name:'Crude Oil (MCL)',cat:'Comm',date:'2026-02-23',contracts:0,entry:65.98,mkt:88.3,pos:0,mult:100,ccy:'USD'},
    {id:'f12',name:'Micro Gold (MGC)',cat:'Comm',date:'2026-03-18',contracts:5,entry:4608,mkt:4679.7,pos:5,mult:10,ccy:'USD'}
  ],
  monthly:[{month:1,pnl:17207535},{month:2,pnl:-8113343},{month:3,pnl:-28059133}]
};

function getFut(){return lsG(SK_FUT)||JSON.parse(JSON.stringify(DEFAULT_FUT))}
function saveFut(d){lsS(SK_FUT,d)}

function calcPnl(p,fxRate){
  if(p.contracts===0)return 0;
  const diff=(p.mkt-p.entry)*p.contracts*p.mult;
  return p.ccy==='USD'?Math.round(diff*fxRate):Math.round(diff);
}

function rFutures(){
  const d=getFut();
  const fx=d.fxRate;
  const active=d.positions.filter(p=>p.contracts!==0);
  const watch=d.positions.filter(p=>p.contracts===0);
  const totalPnl=active.reduce((s,p)=>s+calcPnl(p,fx),0);

  // Build by-class
  const byCls={};d.positions.forEach(p=>{
    if(!byCls[p.cat])byCls[p.cat]=0;
    byCls[p.cat]+=calcPnl(p,fx);
  });
  const totalClsPnl=Object.values(byCls).reduce((s,v)=>s+v,0);

  // Monthly cumulative
  let cum=0;const monthData=d.monthly.map(m=>{cum+=m.pnl;return{...m,cum}});
  const ytd=cum;
  const mtd=d.monthly.length?d.monthly[d.monthly.length-1].pnl+totalPnl:totalPnl;
  const plPct=d.budget?(mtd/d.budget):0;

  let h=`
    <div class="nb">📈 <b>선물거래 블로터</b> — 현재가를 직접 입력하여 실시간 손익을 확인합니다. 환율 변경 시 달러 포지션이 자동 환산됩니다.</div>

    <div class="fc" style="gap:8px">
      <div class="fg"><label>USD/KRW 환율</label>
        <input type="text" id="futFx" value="${ff(fx)}" style="min-width:110px;font-weight:600;color:var(--amber)" onfocus="this.select()"></div>
      <button class="btn bp" style="min-height:42px" onclick="updateFx()">환율 적용</button>
      <div style="flex:1"></div>
      <button class="btn bo2" onclick="openAddPosition()">+ 신규 포지션</button>
    </div>

    <div class="sr" style="grid-template-columns:repeat(3,1fr)">
      <div class="sb"><div class="sl">MTD (미실현 포함)</div><div class="sv mono ${mtd>=0?'up':'dn'}">${mtd>=0?'+':''}${ff(Math.round(mtd))}</div></div>
      <div class="sb"><div class="sl">YTD 실현손익</div><div class="sv mono ${ytd>=0?'up':'dn'}">${ytd>=0?'+':''}${ff(ytd)}</div></div>
      <div class="sb"><div class="sl">수익률</div><div class="sv mono ${plPct>=0?'up':'dn'}">${plPct>=0?'+':''}${(plPct*100).toFixed(2)}%</div></div>
    </div>
    <div class="sr" style="grid-template-columns:repeat(3,1fr)">
      <div class="sb"><div class="sl">운용예산</div><div class="sv mono">${fmt(d.budget)}</div></div>
      <div class="sb"><div class="sl">Stop Loss</div><div class="sv mono" style="color:var(--red)">${fmt(d.stopLoss)}</div></div>
      <div class="sb"><div class="sl">미실현 P&L 합계</div><div class="sv mono ${totalPnl>=0?'up':'dn'}">${totalPnl>=0?'+':''}${ff(totalPnl)}</div></div>
    </div>`;

  // Active positions with inline price edit
  h+=`<div class="tw"><div class="ch"><div class="cd" style="background:var(--green)"></div>보유 포지션 (${active.length}건)</div>
    <div class="tbl-scroll"><table style="min-width:760px"><thead><tr>
      <th>#</th><th>종목</th><th>유형</th><th>진입일</th><th>계약</th><th>진입가</th><th style="text-align:center">현재가 입력</th><th>미실현 P&L</th><th></th>
    </tr></thead><tbody>`;
  active.forEach((p,i)=>{
    const pnl=calcPnl(p,fx);
    const dir=p.contracts>0?'Long':'Short';
    h+=`<tr>
      <td>${i+1}</td><td>${p.name}</td>
      <td><span class="tg ${p.contracts>0?'ti':'to'}">${dir}</span> <span style="font-size:9px;color:var(--t3)">${p.ccy}</span></td>
      <td class="am">${p.date}</td>
      <td class="am" style="font-weight:600">${Math.abs(p.contracts)}</td>
      <td class="am">${p.entry}</td>
      <td style="text-align:center"><input type="text" class="batch-inp" id="fmkt_${p.id}" value="${p.mkt}" style="width:100px" onfocus="this.select()">
        <button class="btn bp" style="padding:3px 8px;font-size:9px;min-height:28px;margin-left:2px" onclick="updateMkt('${p.id}')">적용</button></td>
      <td class="am ${pnl>=0?'up':'dn'}" style="font-weight:600">${pnl>=0?'+':''}${ff(pnl)}</td>
      <td><button class="btn bd" style="padding:3px 8px;font-size:9px;min-height:28px" onclick="closePosition('${p.id}')">청산</button></td>
    </tr>`;
  });
  h+=`</tbody></table></div></div>`;

  // Watchlist with price edit
  if(watch.length){
    h+=`<div class="tw"><div class="ch"><div class="cd" style="background:var(--t3)"></div>관심종목 (미보유)</div>
      <div class="tbl-scroll"><table style="min-width:400px"><thead><tr>
        <th>#</th><th>종목</th><th>유형</th><th style="text-align:center">현재가 입력</th><th>기준가</th>
      </tr></thead><tbody>`;
    watch.forEach((p,i)=>{
      h+=`<tr><td>${i+1}</td><td>${p.name}</td><td class="am">${p.cat}</td>
        <td style="text-align:center"><input type="text" class="batch-inp" id="fmkt_${p.id}" value="${p.mkt}" style="width:100px" onfocus="this.select()">
        <button class="btn bp" style="padding:3px 8px;font-size:9px;min-height:28px;margin-left:2px" onclick="updateMkt('${p.id}')">적용</button></td>
        <td class="am" style="color:var(--t3)">${p.entry}</td></tr>`;
    });
    h+=`</tbody></table></div></div>`;
  }

  // Asset class breakdown + monthly chart
  h+=`<div class="cg">
    <div class="cc"><div class="ct"><div class="cd" style="background:var(--blue)"></div>자산군별 미실현 손익</div>
      <div class="tbl-scroll"><table style="min-width:250px"><thead><tr><th>자산군</th><th style="text-align:right">P&L (원)</th></tr></thead><tbody>`;
  Object.entries(byCls).forEach(([k,v])=>{
    h+=`<tr><td style="text-align:left;font-weight:500">${k}</td><td class="am ${v>=0?'up':'dn'}">${v>=0?'+':''}${ff(v)}</td></tr>`;
  });
  h+=`<tr class="fr"><td style="text-align:left">Total</td><td class="am ${totalClsPnl>=0?'up':'dn'}">${totalClsPnl>=0?'+':''}${ff(totalClsPnl)}</td></tr>`;
  h+=`</tbody></table></div></div>
    <div class="cc"><div class="ct"><div class="cd" style="background:var(--amber)"></div>월별 실현손익</div><canvas id="futMonthlyChart" height="200"></canvas></div></div>`;

  document.getElementById('paneActive').innerHTML=h;
  setTimeout(drawFutMonthly,50);
}

function updateFx(){
  const v=parseFloat(document.getElementById('futFx').value.replace(/,/g,''));
  if(isNaN(v)||v<=0){alert('올바른 환율을 입력하세요.');return}
  const d=getFut();d.fxRate=v;saveFut(d);render();
}

function updateMkt(id){
  const inp=document.getElementById('fmkt_'+id);if(!inp)return;
  const v=parseFloat(inp.value.replace(/,/g,''));
  if(isNaN(v)){alert('올바른 가격을 입력하세요.');return}
  const d=getFut();const p=d.positions.find(x=>x.id===id);
  if(p){p.mkt=v;saveFut(d);render()}
}

function closePosition(id){
  if(!confirm('이 포지션을 청산(계약수 0)으로 변경하시겠습니까?\n실현 손익은 월별 손익에 수동으로 반영하세요.'))return;
  const d=getFut();const p=d.positions.find(x=>x.id===id);
  if(p){p.contracts=0;p.pos=0;saveFut(d);render()}
}

function openAddPosition(){
  const cats=['EQ','FX','Bond','Comm'];
  const catOpts=cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  let h=`<div class="modal-bg" onclick="if(event.target===this)closeAddPos()"><div class="modal">
    <h3>+ 신규 포지션 추가<button class="modal-close" onclick="closeAddPos()">✕</button></h3>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="fg"><label>종목명</label><input type="text" id="npName" placeholder="예: Micro Nasdaq (MNQ)"></div>
      <div style="display:flex;gap:10px">
        <div class="fg" style="flex:1"><label>자산군</label><select id="npCat">${catOpts}</select></div>
        <div class="fg" style="flex:1"><label>통화</label><select id="npCcy"><option value="KRW">KRW</option><option value="USD">USD</option></select></div>
      </div>
      <div style="display:flex;gap:10px">
        <div class="fg" style="flex:1"><label>계약수 (+매수/-매도)</label><input type="number" id="npContracts" placeholder="예: 2 또는 -3"></div>
        <div class="fg" style="flex:1"><label>계약 승수</label><input type="number" id="npMult" placeholder="예: 5"></div>
      </div>
      <div style="display:flex;gap:10px">
        <div class="fg" style="flex:1"><label>진입가</label><input type="text" id="npEntry" placeholder="진입 가격"></div>
        <div class="fg" style="flex:1"><label>현재가</label><input type="text" id="npMkt" placeholder="현재 시장가"></div>
      </div>
      <div class="fg"><label>진입일</label><input type="date" id="npDate" value="${today()}"></div>
      <button class="btn bp" style="width:100%;margin-top:4px" onclick="saveNewPosition()">포지션 추가</button>
    </div>
  </div></div>`;
  document.getElementById('modalRoot').innerHTML=h;
}
function closeAddPos(){document.getElementById('modalRoot').innerHTML=''}

function saveNewPosition(){
  const name=document.getElementById('npName').value.trim();
  const cat=document.getElementById('npCat').value;
  const ccy=document.getElementById('npCcy').value;
  const contracts=parseInt(document.getElementById('npContracts').value);
  const mult=parseFloat(document.getElementById('npMult').value);
  const entry=parseFloat(document.getElementById('npEntry').value.replace(/,/g,''));
  const mkt=parseFloat(document.getElementById('npMkt').value.replace(/,/g,''));
  const date=document.getElementById('npDate').value;
  if(!name||isNaN(contracts)||isNaN(mult)||isNaN(entry)||isNaN(mkt)||!date){
    alert('모든 필드를 입력하세요.');return}
  const d=getFut();
  d.positions.push({id:uid(),name,cat,date,contracts,entry,mkt,pos:contracts,mult,ccy});
  saveFut(d);closeAddPos();render();
}

function drawFutMonthly(){
  const cv=document.getElementById('futMonthlyChart');if(!cv)return;
  const d=getFut().monthly;if(!d.length)return;
  const ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,rect=cv.getBoundingClientRect();
  cv.width=rect.width*dpr;cv.height=200*dpr;ctx.scale(dpr,dpr);
  const W=rect.width,H=200;
  const vs=d.map(m=>m.pnl),labels=d.map(m=>m.month+'월');
  const mx=Math.max(...vs.map(Math.abs),1);
  const pad={t:20,b:30,l:10,r:10},bA=W-pad.l-pad.r;
  const bW=Math.min(bA/vs.length*.5,50),gap=(bA-bW*vs.length)/(vs.length+1);
  const cH=H-pad.t-pad.b,zY=pad.t+cH/2;
  ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(pad.l,zY);ctx.lineTo(W-pad.r,zY);ctx.stroke();
  vs.forEach((v,i)=>{
    const x=pad.l+gap*(i+1)+bW*i,h2=Math.abs(v)/mx*(cH/2-8),y=v>=0?zY-h2:zY;
    const co=v>=0?'#2ee8a5':'#ff5c72';
    ctx.fillStyle=co;rr(ctx,x,y,bW,h2,3);ctx.fill();
    ctx.fillStyle=co;ctx.font='500 10px DM Mono';ctx.textAlign='center';
    ctx.fillText((v>=0?'+':'')+fmt(v),x+bW/2,v>=0?y-5:y+h2+12);
    ctx.fillStyle='#8fa3c0';ctx.font='11px Noto Sans KR';ctx.textAlign='center';
    ctx.fillText(labels[i],x+bW/2,H-pad.b+14);
  });
}

// =========== 현금 입출금 ===========
function rCash(){
  const c=live();let cashBal=0;c.forEach(cat=>cat.items.forEach(it=>{if(it.name==='현금')cashBal=it.bal}));
  const recs=getCash();
  const prods=[];getCats().forEach(cat=>cat.items.forEach(it=>{if(it.name!=='현금')prods.push({cat:cat.name,name:it.name})}));
  const pOpts=prods.map(p=>`<option value="${p.name}">${p.name} (${p.cat})</option>`).join('');
  let h=`<div class="nb">💰 <b>현금 입출금 기록</b> — 투자 관련 입출금 시 연동 상품의 잔액이 자동 조정됩니다.<br><b>예)</b> 지인대여 상환 입금 → 현금↑ + 대여금↓ &nbsp;|&nbsp; 추가 투자 출금 → 현금↓ + 투자상품↑</div>
    <div class="fc"><div class="fg"><label>날짜</label><input type="date" id="cDate" value="${today()}"></div><div class="fg"><label>유형</label><select id="cType" style="min-width:80px"><option value="in">입금</option><option value="out">출금</option></select></div><div class="fg"><label>금액</label><input type="number" id="cAmt" placeholder="금액" style="min-width:140px"></div><div class="fg"><label>투자 연동</label><select id="cInv" onchange="document.getElementById('lkW').style.display=this.value==='yes'?'':'none'" style="min-width:110px"><option value="no">일반</option><option value="yes">투자 관련</option></select></div><div class="fg" id="lkW" style="display:none"><label>연동 상품</label><select id="cLk" style="min-width:160px">${pOpts}</select></div><div class="fg" style="flex:1;min-width:120px"><label>적요</label><input type="text" id="cMemo" placeholder="메모" style="width:100%"></div><button class="btn bp" onclick="addCash()">등록</button></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px"><div class="cd" style="background:var(--cyan)"></div>현금 잔액: <span class="mono" style="color:var(--cyan)">${ff(cashBal)}원</span></div><button class="btn bo2" onclick="expCash()">CSV 내보내기</button></div>`;
  if(!recs.length){h+='<div class="tw"><div class="em">현금 입출금 기록이 없습니다.</div></div>'}
  else{
    const tIn=recs.filter(r=>r.type==='in').reduce((s,r)=>s+r.amount,0),tOut=recs.filter(r=>r.type==='out').reduce((s,r)=>s+r.amount,0),invC=recs.filter(r=>r.isInvestment).length;
    h+=`<div class="sr"><div class="sb"><div class="sl">총 입금</div><div class="sv mono up">+${ff(tIn)}</div></div><div class="sb"><div class="sl">총 출금</div><div class="sv mono dn">-${ff(tOut)}</div></div><div class="sb"><div class="sl">순 입출금</div><div class="sv mono ${tIn-tOut>=0?'up':'dn'}">${tIn-tOut>=0?'+':''}${ff(tIn-tOut)}</div></div><div class="sb"><div class="sl">투자연동</div><div class="sv mono" style="color:var(--purple)">${invC}건</div></div></div>`;
    const chrono=[...recs].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));const bm={};let rb=0;chrono.forEach(r=>{rb+=(r.type==='in'?1:-1)*r.amount;bm[r.id]=rb});
    const sorted=[...recs].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
    h+=`<div class="tw"><div class="tbl-scroll"><table><thead><tr><th>날짜</th><th>유형</th><th style="text-align:right">금액</th><th style="text-align:right">잔액</th><th>연동상품</th><th>적요</th><th></th></tr></thead><tbody>`;
    sorted.forEach(r=>{const tag=r.type==='in'?'<span class="tg ti">입금</span>':'<span class="tg to">출금</span>';const lk=r.isInvestment&&r.linkedProduct?`${r.linkedProduct}<span class="lb">투자연동</span>`:'<span style="color:var(--t3)">-</span>';
      h+=`<tr><td style="text-align:left" class="am">${r.date}</td><td style="text-align:left">${tag}</td><td class="am ${r.type==='in'?'up':'dn'}">${r.type==='in'?'+':'-'}${ff(r.amount)}</td><td class="am">${ff(bm[r.id]||0)}</td><td style="text-align:left;font-size:12px">${lk}</td><td style="text-align:left;color:var(--t3);font-size:11px;max-width:180px;overflow:hidden;text-overflow:ellipsis">${r.memo||''}</td><td><button class="btn bd" style="padding:4px 10px;font-size:10px" onclick="delCash('${r.id}')">삭제</button></td></tr>`});
    h+='</tbody></table></div>';
  }
  document.getElementById('paneActive').innerHTML=h;
}
function addCash(){const date=document.getElementById('cDate').value,type=document.getElementById('cType').value,amount=parseInt(document.getElementById('cAmt').value);const isInvestment=document.getElementById('cInv').value==='yes',linkedProduct=isInvestment?document.getElementById('cLk').value:null,memo=document.getElementById('cMemo').value;if(!date||isNaN(amount)||amount<=0){alert('날짜와 금액을 입력하세요.');return}const r=getCash();r.push({id:uid(),date,type,amount,isInvestment,linkedProduct,memo});saveCash(r);render()}
function delCash(id){if(!confirm('삭제하시겠습니까?'))return;saveCash(getCash().filter(r=>r.id!==id));render()}
function expCash(){const r=getCash();if(!r.length){alert('데이터가 없습니다.');return}let csv='\uFEFF날짜,유형,금액,투자연동,연동상품,적요\n';[...r].sort((a,b)=>a.date.localeCompare(b.date)).forEach(x=>{csv+=`${x.date},${x.type==='in'?'입금':'출금'},${x.amount},${x.isInvestment?'Y':'N'},${x.linkedProduct||''},${x.memo||''}\n`});const b=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='현금입출금_'+today()+'.csv';a.click()}

// =========== 누적 수익 현황 ===========
function rCumul(){
  const c=live(),all=[];c.forEach(cat=>cat.items.forEach(it=>{if(it.init||it.bal)all.push(it)}));
  const ti=all.reduce((s,i)=>s+i.init,0);const cumPp=ti?pct(ti+CUM_PROFIT,ti):0;const recs=getDaily();
  let h=`<div class="cc full" style="margin-bottom:20px"><div class="ct"><div class="cd" style="background:var(--green)"></div>포트폴리오 손익 요약</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      <div style="padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--t3);font-weight:600;margin-bottom:6px">누적 투자수익</div><div class="mono up" style="font-size:20px">+${ff(CUM_PROFIT)}</div></div>
      <div style="padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--t3);font-weight:600;margin-bottom:6px">수익률</div><div class="mono up" style="font-size:20px">+${cumPp.toFixed(2)}%</div></div>
      <div style="padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--t3);font-weight:600;margin-bottom:6px">총 기록</div><div class="mono" style="font-size:20px;color:var(--blue)">${recs.length}건</div></div></div></div>`;
  if(recs.length>=2){h+=`<div class="cc full"><div class="ct"><div class="cd" style="background:var(--blue)"></div>일별 총 평가금액 추이</div><div class="cw"><canvas id="cumC"></canvas></div></div>`;
    h+=`<div class="cc full" style="margin-top:16px"><div class="ct"><div class="cd" style="background:var(--amber)"></div>상품별 일별 수익 추이</div><div id="pdC"></div></div>`}
  else{h+='<div class="tw"><div class="em">금융투자자산 탭에서 일별 잔액을 2건 이상 기록하면 차트가 표시됩니다.</div></div>'}
  const rk=all.filter(x=>x.init>0).map(x=>({...x,pn:x.bal-x.init,p2:pct(x.bal,x.init)})).sort((a,b)=>b.pn-a.pn);
  h+=`<div class="tw" style="margin-top:20px"><div class="ch"><div class="cd" style="background:var(--purple)"></div>상품별 수익 랭킹</div><div class="tbl-scroll"><table><thead><tr><th>순위</th><th>상품명</th><th>기초금액</th><th>현재잔액</th><th>손익</th><th>수익률</th></tr></thead><tbody>`;
  rk.forEach((r,i)=>{h+=`<tr><td>${i+1}</td><td>${r.name}</td><td class="am">${ff(r.init)}</td><td class="am">${ff(r.bal)}</td><td class="am ${r.pn>=0?'up':'dn'}">${r.pn>=0?'+':''}${ff(r.pn)}</td><td class="am ${r.p2>=0?'up':'dn'}">${r.p2>=0?'+':''}${r.p2.toFixed(2)}%</td></tr>`});
  h+='</tbody></table></div>';
  if(recs.length){const sorted=[...recs].sort((a,b)=>b.date.localeCompare(a.date));
    h+=`<div class="tw" style="margin-top:20px"><div class="ch"><div class="cd" style="background:var(--cyan)"></div>일별 기록 <span style="margin-left:auto;font-size:11px;color:var(--t3)">${recs.length}건</span></div><div class="tbl-scroll"><table><thead><tr><th>날짜</th><th>상품</th><th>평가금액</th><th>메모</th><th></th></tr></thead><tbody>`;
    sorted.slice(0,100).forEach(r=>{h+=`<tr><td style="text-align:left" class="am">${r.date}</td><td style="text-align:left">${r.product}</td><td class="am">${ff(r.bal)}</td><td style="text-align:left;color:var(--t3);font-size:11px">${r.memo||''}</td><td><button class="btn bd" style="padding:4px 10px;font-size:10px" onclick="delDR('${r.id}')">삭제</button></td></tr>`});
    h+='</tbody></table></div>'}
  document.getElementById('paneActive').innerHTML=h;
  if(recs.length>=2)setTimeout(()=>{drawCum(recs);drawPD(recs)},60);
}
function delDR(id){saveDaily(getDaily().filter(r=>r.id!==id));render()}
function drawCum(recs){const cv=document.getElementById('cumC');if(!cv)return;const ctx=cv.getContext('2d'),dpr=window.devicePixelRatio||1,rect=cv.parentElement.getBoundingClientRect();cv.width=rect.width*dpr;cv.height=320*dpr;ctx.scale(dpr,dpr);const W=rect.width,H=320;const bd={};recs.forEach(r=>{if(!bd[r.date])bd[r.date]=0;bd[r.date]+=r.bal});const ds=Object.keys(bd).sort(),vs=ds.map(d=>bd[d]);if(vs.length<2)return;const pad={t:30,b:50,l:80,r:20},cW2=W-pad.l-pad.r,cH2=H-pad.t-pad.b;const mn=Math.min(...vs)*.98,mx2=Math.max(...vs)*1.02,rg=mx2-mn||1;const xO=i=>pad.l+(i/(ds.length-1||1))*cW2,yO=v=>pad.t+(1-(v-mn)/rg)*cH2;ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;for(let i=0;i<=4;i++){const y=pad.t+cH2*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.fillStyle='#516480';ctx.font='10px DM Mono';ctx.textAlign='right';ctx.fillText(fmt(mx2-rg*i/4),pad.l-8,y+3)}ctx.beginPath();ctx.moveTo(xO(0),yO(vs[0]));vs.forEach((v,i)=>ctx.lineTo(xO(i),yO(v)));ctx.lineTo(xO(vs.length-1),pad.t+cH2);ctx.lineTo(xO(0),pad.t+cH2);ctx.closePath();const gr=ctx.createLinearGradient(0,pad.t,0,pad.t+cH2);gr.addColorStop(0,'rgba(77,142,255,.15)');gr.addColorStop(1,'rgba(77,142,255,0)');ctx.fillStyle=gr;ctx.fill();ctx.beginPath();ctx.moveTo(xO(0),yO(vs[0]));vs.forEach((v,i)=>ctx.lineTo(xO(i),yO(v)));ctx.strokeStyle='#4d8eff';ctx.lineWidth=2;ctx.stroke();vs.forEach((v,i)=>{ctx.beginPath();ctx.arc(xO(i),yO(v),3,0,Math.PI*2);ctx.fillStyle='#4d8eff';ctx.fill();ctx.strokeStyle='#0a0e17';ctx.lineWidth=1.5;ctx.stroke()});ctx.fillStyle='#516480';ctx.font='10px DM Mono';ctx.textAlign='center';ds.forEach((d,i)=>{if(ds.length<=15||i%(Math.ceil(ds.length/12))===0)ctx.fillText(d.slice(5),xO(i),H-pad.b+18)})}
function drawPD(recs){const el=document.getElementById('pdC');if(!el)return;const bp={};recs.forEach(r=>{if(!bp[r.product])bp[r.product]=[];bp[r.product].push(r)});let h='<div class="tbl-scroll"><table><thead><tr><th>상품</th><th>최초 기록</th><th>최근 기록</th><th>기간 손익</th><th>기록 수</th></tr></thead><tbody>';Object.entries(bp).forEach(([p,rr2])=>{rr2.sort((a,b)=>a.date.localeCompare(b.date));const f=rr2[0].bal,l=rr2[rr2.length-1].bal,d2=l-f;h+=`<tr><td style="text-align:left">${p}</td><td class="am">${rr2[0].date} / ${ff(f)}</td><td class="am">${rr2[rr2.length-1].date} / ${ff(l)}</td><td class="am ${d2>=0?'up':'dn'}">${d2>=0?'+':''}${ff(d2)}</td><td class="am">${rr2.length}건</td></tr>`});h+='</tbody></table></div>';el.innerHTML=h}

// =========== 전체 투자자산 (금융투자 합계만, 나머지 수정 가능, 상품추가 팝업) ===========
function rTotal(){
  const c=live();const cats=getCats();let h='',gi=0;
  const allBal=[];c.forEach(cat=>cat.items.forEach(it=>{if(it.bal>0)allBal.push({name:it.name,val:it.bal})}));

  c.forEach((cat,ci)=>{
    const vis=cat.items.filter(x=>x.init||x.bal);if(!vis.length&&ci===0)return;
    const cI=vis.reduce((s,i)=>s+i.init,0),cB=vis.reduce((s,i)=>s+i.bal,0),cP=cB-cI,cPp=cI?pct(cB,cI):0;
    const catObj=cats.find(x=>x.name===cat.name);const catId=catObj?catObj.id:'';
    const isFin=(ci===0);

    h+=`<div class="tw" style="margin-bottom:20px"><div class="ch"><div class="cd" style="background:${cat.color}"></div>${cat.name}
      <span style="margin-left:auto;font-size:11px;color:var(--t3);font-weight:400">평가합계: <span class="mono" style="color:var(--t1)">${fmt(cB)}</span></span></div>`;

    if(isFin){
      h+=`<div class="tbl-scroll"><table style="min-width:400px"><thead><tr><th></th><th>구분</th><th>기초금액</th><th>현재잔액</th><th>손익</th><th>수익률</th></tr></thead><tbody>
        <tr class="fr"><td></td><td>금융투자 합계 (${vis.length}개 상품)</td><td class="am">${ff(cI)}</td><td class="am">${ff(cB)}</td>
          <td class="am ${cP>=0?'up':'dn'}">${cP>=0?'+':''}${ff(cP)}</td>
          <td class="am ${cPp>=0?'up':'dn'}">${cPp>=0?'+':''}${cPp.toFixed(2)}%</td></tr>
        </tbody></table></div>`;
    } else {
      h+=`<div class="tbl-scroll"><table style="min-width:500px"><thead><tr><th>#</th><th>상품명</th><th>기초금액</th><th>현재잔액</th><th style="text-align:center">잔액 수정</th><th>손익</th><th>수익률</th></tr></thead><tbody>`;
      vis.forEach(it=>{gi++;const pnl2=it.bal-it.init,p2=it.init?pct(it.bal,it.init):0;
        const origItem=catObj?catObj.items.find(x=>x.name===it.name):null;
        const itemId=origItem?origItem.id:it.name;
        h+=`<tr><td>${gi}</td><td>${it.name}</td><td class="am">${ff(it.init)}</td><td class="am">${ff(it.bal)}</td>
          <td style="text-align:center"><input type="text" class="batch-inp" id="te_${catId}_${itemId}" value="${ff(it.bal)}" style="width:120px;text-align:right" onfocus="this.select()">
          <button class="btn bp" style="padding:3px 8px;font-size:9px;min-height:28px;margin-left:4px" onclick="saveItemBal('${catId}','${itemId}')">저장</button></td>
          <td class="am ${pnl2>=0?'up':'dn'}">${pnl2>=0?'+':''}${ff(pnl2)}</td>
          <td class="am ${p2>=0?'up':'dn'}">${it.init?(p2>=0?'+':'')+p2.toFixed(2)+'%':'-'}</td></tr>`});
      if(vis.length){
        h+=`<tr class="fr"><td></td><td>소계</td><td class="am">${ff(cI)}</td><td class="am">${ff(cB)}</td><td></td>
          <td class="am ${cP>=0?'up':'dn'}">${cP>=0?'+':''}${ff(cP)}</td>
          <td class="am ${cPp>=0?'up':'dn'}">${cI?(cPp>=0?'+':'')+cPp.toFixed(2)+'%':'-'}</td></tr>`}
      h+=`</tbody></table></div>`;
    }
    h+=`</div>`;
  });

  const all2=[];c.forEach(cat=>cat.items.forEach(it=>{if(it.init||it.bal)all2.push(it)}));
  const gI=all2.reduce((s,i)=>s+i.init,0),gB=all2.reduce((s,i)=>s+i.bal,0),gP=gB-gI,gPp=pct(gB,gI);
  h+=`<div class="tw"><div class="tbl-scroll"><table style="min-width:400px"><tbody><tr class="fr" style="font-size:14px"><td style="width:36px"></td><td style="text-align:left;font-weight:800">총 합계</td>
    <td class="am">${ff(gI)}</td><td class="am">${ff(gB)}</td>
    <td class="am ${gP>=0?'up':'dn'}">${gP>=0?'+':''}${ff(gP)}</td>
    <td class="am ${gPp>=0?'up':'dn'}">${gPp>=0?'+':''}${gPp.toFixed(2)}%</td></tr></tbody></table></div></div>`;

  h+=`<div style="margin-bottom:16px;text-align:right"><button class="btn bg2" style="padding:8px 16px;font-size:12px" onclick="openAddItemModal()">+ 상품 추가</button></div>`;

  h+='<div class="cg">';const catData=c.map(x=>({name:x.name,val:x.items.reduce((s,i)=>s+Math.max(i.bal,0),0),color:x.color})).filter(x=>x.val>0);
  h+=`<div class="cc"><div class="ct"><div class="cd" style="background:var(--blue)"></div>카테고리별 비중</div>${donut(catData)}</div>`;
  allBal.sort((a,b)=>b.val-a.val);h+=`<div class="cc"><div class="ct"><div class="cd" style="background:var(--green)"></div>상품별 잔액 TOP 8</div>${donut(allBal.slice(0,8).map((p,i)=>({...p,color:PAL[i%PAL.length]})))}</div>`;h+='</div>';
  document.getElementById('paneActive').innerHTML=h;
}
function saveItemBal(catId,itemId){
  const inp=document.getElementById('te_'+catId+'_'+itemId);
  if(!inp)return;
  const num=parseInt(inp.value.replace(/,/g,''));
  if(isNaN(num)){alert('올바른 금액을 입력하세요.');return}
  const cats=getCats();const cat=cats.find(c=>c.id===catId);
  if(!cat)return;
  if(num===0){
    if(!confirm("잔액이 0입니다. 이 상품을 삭제하시겠습니까?"))return;
    cat.items=cat.items.filter(i=>i.id!==itemId);
    saveCats(cats);render();return;
  }
  const item=cat.items.find(i=>i.id===itemId);
  if(item){item.bal=num;saveCats(cats);render()}
}
function openAddItemModal(){
  const cats=getCats();
  const opts=cats.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  let h=`<div class="modal-bg" onclick="if(event.target===this)closeAddItemModal()"><div class="modal">
    <h3>+ 상품 추가<button class="modal-close" onclick="closeAddItemModal()">✕</button></h3>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="fg"><label>카테고리</label><select id="aiCat">${opts}</select></div>
      <div class="fg"><label>상품명</label><input type="text" id="aiName" placeholder="예: 강남아파트"></div>
      <div style="display:flex;gap:10px">
        <div class="fg" style="flex:1"><label>기초금액</label><input type="number" id="aiInit" placeholder="투자원금"></div>
        <div class="fg" style="flex:1"><label>현재잔액</label><input type="number" id="aiBal" placeholder="비우면 기초금액과 동일"></div>
      </div>
      <button class="btn bp" style="width:100%;margin-top:4px" onclick="saveAddItem()">추가</button>
    </div>
  </div></div>`;
  document.getElementById('modalRoot').innerHTML=h;
}
function closeAddItemModal(){document.getElementById('modalRoot').innerHTML=''}
function saveAddItem(){
  const catId=document.getElementById('aiCat').value;
  const name=document.getElementById('aiName').value.trim();
  const init=parseInt(document.getElementById('aiInit').value)||0;
  const bal=parseInt(document.getElementById('aiBal').value)||init;
  if(!name){alert('상품명을 입력하세요.');return}
  const cats=getCats();const cat=cats.find(c=>c.id===catId);
  if(!cat)return;
  cat.items.push({id:uid(),name,init,bal});
  saveCats(cats);closeAddItemModal();render();
}
function donut(data){const total=data.reduce((s,d)=>s+d.val,0);if(!total)return'<div class="em">데이터 없음</div>';const R=72,CX=90,CY=90,SW=18,ci=2*Math.PI*R;let cu=0,p='';data.forEach(d=>{const f=d.val/total,da=ci*f,ga=ci-da,o=-ci*cu+ci*.25;p+=`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${d.color}" stroke-width="${SW}" stroke-dasharray="${da} ${ga}" stroke-dashoffset="${o}" opacity=".85"/>`;cu+=f});const lg2=data.map(d=>`<div class="li"><div class="ld" style="background:${d.color}"></div><span class="ln">${d.name}</span><span class="lp">${(d.val/total*100).toFixed(1)}%</span></div>`).join('');return`<div class="dw"><svg width="180" height="180" viewBox="0 0 180 180"><circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(255,255,255,.03)" stroke-width="${SW}"/>${p}<text x="${CX}" y="${CY-6}" text-anchor="middle" fill="var(--t3)" font-size="10" font-family="Outfit">합계</text><text x="${CX}" y="${CY+12}" text-anchor="middle" fill="var(--t1)" font-size="13" font-weight="600" font-family="DM Mono">${fmt(total)}</text></svg><div class="lg">${lg2}</div></div>`}

// =========== ASSET MANAGER ===========
function openMgr(){const cats=getCats();let h=`<div class="modal-bg" onclick="if(event.target===this)closeMgr()"><div class="modal"><h3>⚙ 자산 관리<button class="modal-close" onclick="closeMgr()">✕</button></h3><div class="nb">카테고리 및 자산 항목을 추가/삭제할 수 있습니다.</div>`;cats.forEach(cat=>{h+=`<div style="margin-bottom:20px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div class="cd" style="background:${cat.color}"></div><span style="font-weight:700;font-size:14px">${cat.name}</span><button class="btn bd" style="padding:3px 10px;font-size:10px;margin-left:auto" onclick="delCat('${cat.id}')">카테고리 삭제</button></div><div class="mgr">`;cat.items.forEach(it=>{if(it.name==='현금')return;h+=`<div class="mgr-item"><span>${it.name}</span><span class="am" style="color:var(--t3)">기초: ${ff(it.init)}</span><button class="btn bd" style="padding:2px 8px;font-size:10px" onclick="delItem('${cat.id}','${it.id}')">삭제</button></div>`});h+=`</div><div class="mgr-add"><input type="text" id="newItem_${cat.id}" placeholder="새 상품명" style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--t1);font-size:12px;flex:1"><input type="number" id="newItemInit_${cat.id}" placeholder="기초금액" style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--t1);font-size:12px;width:120px;font-family:'DM Mono',monospace"><button class="btn bg2" style="padding:6px 14px;font-size:11px" onclick="addItem('${cat.id}')">+ 추가</button></div></div>`});h+=`<div style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px"><div style="font-weight:600;font-size:13px;margin-bottom:10px">새 카테고리 추가</div><div class="mgr-add"><input type="text" id="newCatName" placeholder="카테고리명" style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--t1);font-size:12px;flex:1"><button class="btn bg2" style="padding:6px 14px;font-size:11px" onclick="addCat()">+ 추가</button></div></div><div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end"><button class="btn bd" onclick="if(confirm('모든 데이터를 초기화하시겠습니까?')){Object.values(SK).forEach(k=>localStorage.removeItem(k));closeMgr();render()}">전체 초기화</button><button class="btn bp" onclick="closeMgr()">닫기</button></div></div></div>`;document.getElementById('modalRoot').innerHTML=h}
function closeMgr(){document.getElementById('modalRoot').innerHTML='';render()}
function addCat(){const name=document.getElementById('newCatName').value.trim();if(!name){alert('카테고리명을 입력하세요.');return}const cats=getCats();cats.push({id:uid(),name,color:CAT_COLORS[cats.length%CAT_COLORS.length],items:[]});saveCats(cats);openMgr()}
function delCat(catId){if(!confirm('이 카테고리를 삭제하시겠습니까?'))return;saveCats(getCats().filter(c=>c.id!==catId));openMgr()}
function addItem(catId){const name=document.getElementById('newItem_'+catId).value.trim();const init=parseInt(document.getElementById('newItemInit_'+catId).value)||0;if(!name){alert('상품명을 입력하세요.');return}const cats=getCats();const cat=cats.find(c=>c.id===catId);if(!cat)return;cat.items.push({id:uid(),name,init,bal:init});saveCats(cats);openMgr()}
function delItem(catId,itemId){if(!confirm('이 상품을 삭제하시겠습니까?'))return;const cats=getCats();const cat=cats.find(c=>c.id===catId);if(!cat)return;cat.items=cat.items.filter(i=>i.id!==itemId);saveCats(cats);openMgr()}

// =========== INIT ===========
renderTabs();render();
window.addEventListener('resize',()=>{if(curTab==='fin')setTimeout(()=>{drawDailyPnlChart();drawMonthlyPnlChart()},50)});
