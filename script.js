(function(){const L=Logic,D=DATA,$=s=>document.querySelector(s),W=L.won,esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const bars=(el,rows,fmt,best)=>{const m=Math.max(...rows.map(r=>r[1]),1e-9);$(el).innerHTML=rows.map(r=>`<div class="row${r[2]?' best':''}"><span>${r[0]}</span><div class="bar"><i style="width:${Math.max(0,r[1])/m*100}%"></i></div><b>${fmt(r[1])}</b></div>`).join('')||'<p>해당 조건의 데이터가 없습니다. 필터를 바꿔 보세요.</p>'};
function form(host,defs,cb){$(host).innerHTML=defs.map(d=>`<label for="n_${d.id}">${d.l}<input type="number" id="n_${d.id}" min="0" step="${d.s}" value="${d.v}"><input type="range" id="r_${d.id}" aria-label="${d.l} 슬라이더" min="0" max="${d.m}" step="${d.s}" value="${d.v}"></label>`).join('');
 defs.forEach(d=>{const n=$('#n_'+d.id),r=$('#r_'+d.id);n.oninput=()=>{r.value=n.value;cb()};r.oninput=()=>{n.value=r.value;cb()}});
 return{get:()=>Object.fromEntries(defs.map(d=>[d.id,parseFloat($('#n_'+d.id).value)||0])),set:o=>{for(const k in o){$('#n_'+k).value=$('#r_'+k).value=o[k]}cb()}}}
/* 시뮬레이터 */
const PRE={'온라인 쇼핑형':{online:600000,offline:150000,designated:80000,count:18,prevPerf:750000},'소액 다빈도 결제형':{online:150000,offline:250000,designated:100000,count:70,prevPerf:400000},'생활비 집중형':{online:100000,offline:600000,designated:300000,count:25,prevPerf:700000},'균형 소비형':{online:300000,offline:300000,designated:100000,count:22,prevPerf:600000}};
$('#ruleTable').innerHTML='<table><tr><th>유형</th><th>가정한 규칙</th><th>월 한도</th></tr>'+Object.entries(L.RULES).map(([k,r])=>`<tr><td>${r.name}</td><td>${k==='t369'?`건당 ${r.minTxn}원 이상 결제 시 ${r.perTxn}원, 전월실적 조건 없음`:`${k==='all'?'총 결제금액':'지정 업종(카페·식음료, 편의점) 결제금액'}의 ${r.rate*100}%, 전월실적 ${W(r.minPerf)} 이상`}</td><td>${W(r.cap)}</td></tr>`).join('')+'</table><p class="note">모든 값은 가정이며 공식 조건이 아닙니다.</p>';
$('#cur').innerHTML=Object.entries(L.RULES).map(([k,r])=>`<option value="${k}">${r.name}</option>`).join('');
const sim=form('#simIn',[{id:'online',l:'월간 온라인 결제금액(원)',v:300000,m:2000000,s:10000},{id:'offline',l:'월간 오프라인 결제금액(원)',v:300000,m:2000000,s:10000},{id:'designated',l:'혜택 지정 업종 결제금액(원)',v:100000,m:1000000,s:10000},{id:'count',l:'조건 충족 결제 횟수(건)',v:22,m:150,s:1},{id:'prevPerf',l:'전월 이용실적(원)',v:600000,m:2000000,s:10000}],run);
$('#presets').innerHTML=Object.keys(PRE).map(k=>`<button type="button" aria-pressed="false">${k}</button>`).join('');
$('#presets').onclick=e=>{const b=e.target.closest('button');if(!b)return;[...$('#presets').children].forEach(x=>x.setAttribute('aria-pressed',x===b));sim.set(PRE[b.textContent])};
$('#cur').onchange=run;let last;
function run(){const i=sim.get(),e=L.validate(i);$('#errs').innerHTML=e.map(esc).join('<br>');
 if(e.length){$('#simOut').innerHTML='<p class="err">입력값을 수정하면 결과가 표시됩니다.</p>';last=null;mobile();return}
 const cur=$('#cur').value,r=L.recommend(i,cur);last={i,cur,r};
 $('#simOut').innerHTML=`<p class="note">단순화된 추정치 · 가정 기반</p><div class="bars" id="cb"></div><p>최적 혜택 <b>${L.RULES[r.best].name}</b></p><p>현재 대비 월 추가 혜택 <span class="big ${r.extra>0?'pos':''}">${W(r.extra)}</span></p><p>예상 연간 캐시백 차이 <b>${W(r.annual)}</b></p><p>${esc(r.reason)}</p><details><summary>계산식과 적용한 가정</summary><ul>${Object.keys(r.res).map(k=>`<li>${L.RULES[k].name}: ${esc(r.res[k].formula)}</li>`).join('')}</ul><p class="note">연간 차이 = 월 차이 × 12(소비 패턴 고정 가정)</p></details>`;
 bars('#cb',Object.keys(r.res).map(k=>[L.RULES[k].name+(k===cur?' (현재)':''),r.res[k].amount,k===r.best]),W);mobile()}
/* 모바일 프로토타입 */
let ps=0,done=false;const T=['소비 패턴 분석','혜택 유형별 비교','맞춤 혜택 추천','혜택 변경 확인'];
function mobile(){const el=$('#phone');if(!last){el.innerHTML='<p>유효한 입력값이 필요합니다.</p>';return}const{i,r,cur}=last,t=i.online+i.offline;let h='<div class="cc">Concept UI · 실제 앱 화면이 아닙니다</div><h4>'+T[ps]+'</h4>';
 if(ps===0)h+=`<p>이번 달 결제 <b>${W(t)}</b> · ${i.count}건</p><p>온라인 ${t?Math.round(i.online/t*100):0}% / 오프라인 ${t?100-Math.round(i.online/t*100):0}%</p><p>지정 업종 ${W(i.designated)}</p>`;
 if(ps===1)h+=Object.keys(r.res).map(k=>`<p>${L.RULES[k].name}<br><b>${W(r.res[k].amount)}</b></p>`).join('');
 if(ps===2)h+=`<p><b>${L.RULES[r.best].name}</b> 추천</p><p>${esc(r.reason)}</p><p class="note">가정 기반 추정 · 실제와 다를 수 있습니다.</p>`;
 if(ps===3)h+=done?`<p><b>${L.RULES[r.best].name}</b>으로 변경 요청을 확인했습니다(시연).</p>`:`<p>${L.RULES[cur].name} → <b>${L.RULES[r.best].name}</b></p><button class="btn" id="chg">변경 확인</button>`;
 el.innerHTML=h;$('#pstep').textContent=`화면 ${ps+1} / 4`;const c=$('#chg');if(c)c.onclick=()=>{done=true;mobile()}}
$('#prev').onclick=()=>{ps=Math.max(0,ps-1);mobile()};$('#next').onclick=()=>{ps=Math.min(3,ps+1);mobile()};
/* 분석 대시보드 */
const sel=(id,l,opts)=>`<label>${l}<select id="${id}"><option value="">전체</option>${opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label>`,SEGN=Object.values(D.SEG).map(s=>s.n);
$('#filters').innerHTML=sel('fM','조회 월',D.MONTHS.map(m=>[m,m]))+sel('fA','연령대',D.AGES.map(a=>[a,a]))+sel('fS','소비 유형',SEGN.map(s=>[s,s]))+sel('fC','결제 채널',[['online','온라인'],['offline','오프라인']])+sel('fT','캐시백 유형',Object.entries(L.RULES).map(([k,r])=>[k,r.name]));
['fM','fA','fS','fC','fT'].forEach(id=>$('#'+id).onchange=dash);
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),grp=(a,f)=>{const m=new Map;a.forEach(x=>{const k=f(x);(m.get(k)||m.set(k,[]).get(k)).push(x)});return m},pairs=a=>new Set(a.map(x=>x.customer_id+x.transaction_date.slice(0,7))).size,pct=x=>(x*100).toFixed(2)+'%';
function dash(){const v=id=>$('#'+id).value,a=D.tx.filter(t=>(!v('fM')||t.transaction_date.startsWith(v('fM')))&&(!v('fA')||t.age_group===v('fA'))&&(!v('fS')||t.spending_segment===v('fS'))&&(!v('fC')||t.payment_channel===v('fC'))&&(!v('fT')||t.cashback_type===v('fT')));
 const mo=v('fM')?1:3,P=pairs(a),amt=sum(a,t=>t.transaction_amount),cb=sum(a,t=>t.cashback_amount),d=(x,y)=>y?x/y:0;
 $('#kpis').innerHTML=[['월 활성 고객 수',Math.round(d(P,mo)).toLocaleString()+'명'],['고객당 월평균 결제금액',W(d(amt,P))],['고객당 월평균 결제 횟수',d(a.length,P).toFixed(1)+'회'],['평균 객단가',W(d(amt,a.length))],['총 캐시백 비용',W(cb)],['캐시백 비용률',pct(d(cb,amt))]].map(k=>`<div><span>${k[0]}</span><b>${k[1]}</b></div>`).join('');
 bars('#cMonth',[...grp(a,t=>t.transaction_date.slice(0,7))].sort().map(([k,x])=>[k,sum(x,t=>t.transaction_amount)]),W);
 bars('#cCat',[...grp(a,t=>t.merchant_category)].map(([k,x])=>[k,sum(x,t=>t.transaction_amount)]).sort((p,q)=>q[1]-p[1]),W);
 bars('#cSeg',[...grp(a,t=>t.spending_segment)].map(([k,x])=>[k,d(sum(x,t=>t.transaction_amount),pairs(x))]),W);
 bars('#cCb',[...grp(a,t=>t.cashback_type)].map(([k,x])=>[L.RULES[k].name,d(sum(x,t=>t.cashback_amount),sum(x,t=>t.transaction_amount))*100]),n=>n.toFixed(2)+'%');
 const cm=new Map;a.forEach(t=>{const o=cm.get(t.customer_id)||cm.set(t.customer_id,{s:0,n:0,m:new Set}).get(t.customer_id);o.s+=t.transaction_amount;o.n++;o.m.add(t.transaction_date.slice(0,7))});
 const pts=[...cm.values()].map(o=>[o.n/o.m.size,o.s/o.m.size/1e4]),mx=Math.max(1,...pts.map(p=>p[0])),my=Math.max(1,...pts.map(p=>p[1]));
 $('#scatter').innerHTML=pts.map(p=>`<circle cx="${30+p[0]/mx*555}" cy="${200-p[1]/my*185}" r="2.2" fill="#2855FF" fill-opacity=".45"/>`).join('')+`<text x="30" y="214" font-size="11">0 ~ ${Math.round(mx)}건</text><text x="560" y="14" font-size="11" text-anchor="end">최대 ${Math.round(my)}만원</text>`}
dash();
/* 세그먼트 표 */
const STR={'온라인 쇼핑형':'온라인 비중이 높아 정률 혜택 또는 온라인 지정 혜택 검토','소액 다빈도 결제형':'건당 혜택이 유리하나 비용 총량 관리 필요','생활비 집중형':'지정 업종 혜택의 체감도가 높음, 한도 설계 중요','균형 소비형':'범용 정률 혜택이 무난'};
$('#segTable').innerHTML='<table><tr><th>유형</th><th>고객 수</th><th>월평균 결제금액</th><th>월 결제 횟수</th><th>온라인 비중</th><th>이용률</th><th>비용률</th><th>혜택 전략(가설)</th></tr>'+[...grp(D.tx,t=>t.spending_segment)].map(([k,x])=>{const c=new Set(x.map(t=>t.customer_id)).size,p=pairs(x),am=sum(x,t=>t.transaction_amount);return`<tr><td>${k}</td><td>${c}</td><td>${W(am/p)}</td><td>${(x.length/p).toFixed(1)}</td><td>${(sum(x.filter(t=>t.payment_channel==='online'),t=>t.transaction_amount)/am*100).toFixed(0)}%</td><td>${(p/(c*3)*100).toFixed(0)}%</td><td>${pct(sum(x,t=>t.cashback_amount)/am)}</td><td>${STR[k]||''}</td></tr>`}).join('')+'</table><p class="note">이용률 = 고객-월 쌍 중 결제가 있는 비율. 유형은 데이터 생성 시 부여한 가상 프로필이며, 표의 지표는 그 데이터에서 계산됩니다.</p>';
/* SQL, CSV */
$('#sql').innerHTML=D.SQLQ.map((q,n)=>`<details><summary>${esc(q.t)}</summary><p><b>목적</b> ${esc(q.p)}</p><pre><code>${esc(q.q)}</code></pre><button class="btn ghost" data-n="${n}">쿼리 복사</button><p><b>해석</b> ${esc(q.r)}</p></details>`).join('');
$('#sql').onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=D.SQLQ[b.dataset.n].q;const ok=()=>b.textContent='복사됨';(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(ok,()=>{const x=document.createElement('textarea');x.value=t;document.body.append(x);x.select();document.execCommand('copy');x.remove();ok()})};
$('#csv').onclick=function(){const H=Object.keys(D.tx[0]);const s='\ufeff'+H.join(',')+'\n'+D.tx.map(t=>H.map(h=>t[h]).join(',')).join('\n');this.href=URL.createObjectURL(new Blob([s],{type:'text/csv;charset=utf-8'}))};
/* 비즈니스 시뮬레이터 */
const biz=form('#bizIn',[{id:'N',l:'대상 고객 수(명)',v:100000,m:1000000,s:1000},{id:'a',l:'기존 월간 활성 이용률(%)',v:30,m:100,s:1},{id:'d',l:'활성 이용률 개선폭(%p)',v:2,m:20,s:.5},{id:'s',l:'고객당 월평균 결제금액(원)',v:300000,m:1000000,s:10000},{id:'g',l:'결제금액 증가율(%)',v:2,m:30,s:.5},{id:'c0',l:'기존 캐시백 비용률(%)',v:0.4,m:2,s:.05},{id:'c1',l:'예상 캐시백 비용률(%)',v:0.45,m:2,s:.05},{id:'m',l:'가정한 결제 수익률(%)',v:1,m:5,s:.05}],()=>{const x=biz.get();if(x.a+x.d>100){$('#bizOut').innerHTML='<p class="err">기존 이용률과 개선폭의 합이 100%를 넘을 수 없습니다.</p>';return}
 const r=L.bizSim({N:x.N,a:x.a/100,d:x.d/100,s:x.s,g:x.g/100,c0:x.c0/100,c1:x.c1/100,m:x.m/100});
 $('#bizOut').innerHTML=`<p class="note">시나리오 분석용 가정이며 공개된 실제 사업 수치가 아닙니다(월 기준).</p><table><tr><td>추가 활성 고객 수</td><td>${Math.round(r.addActive).toLocaleString()}명</td></tr><tr><td>예상 추가 결제금액</td><td>${W(r.addSpend)}</td></tr><tr><td>추가 혜택 비용 (비용 가정)</td><td>${W(r.addCost)}</td></tr><tr><td>증분 결제 수익 (수익 가정)</td><td>${W(r.rev)}</td></tr></table><p>추정 순기여액 <span class="big ${r.net<0?'neg':'pos'}">${r.net<0?'−'+W(-r.net)+' (적자)':W(r.net)+' (흑자)'}</span></p><p class="note">순기여 = 증분 결제 수익 − 추가 혜택 비용. 추가 결제금액 = 예상 활성 고객 × 결제금액 × (1+증가율) − 기존 활성 고객 × 결제금액.</p>`});
biz.set({});$('#presets').firstChild.click();
})();
