/* 가상 데이터 생성(Synthetic Data, 고정 시드 20261115) + SQL 쿼리 정의 */
(function(g){
const L=g.Logic;
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const SEG={shop:{n:'온라인 쇼핑형',on:.75,tk:42000,cnt:9,off:[1,1,1,1,1]},small:{n:'소액 다빈도 결제형',on:.3,tk:6500,cnt:42,off:[3,4,2,.5,1]},life:{n:'생활비 집중형',on:.2,tk:38000,cnt:16,off:[1,1,2,5,3]},bal:{n:'균형 소비형',on:.5,tk:20000,cnt:15,off:[2,1,2,2,2]}};
const ON=['온라인쇼핑','구독·콘텐츠','외식'],OFF=['카페·식음료','편의점','교통','마트·생활','외식'];
const AGES=['20대','30대','40대','50대 이상'],CB=['t369','all','more'],MONTHS=['2026-07','2026-08','2026-09'];
const pick=(r,arr,w)=>{w=w||arr.map(()=>1);let x=r()*w.reduce((a,b)=>a+b),i=0;while((x-=w[i])>=0&&i<arr.length-1)i++;return arr[i]};
function gen(seed){const r=rng(seed),tx=[],keys=Object.keys(SEG);let id=0;
 for(let c=1;c<=1000;c++){const sk=pick(r,keys,[.25,.2,.3,.25]),s=SEG[sk],age=pick(r,AGES,[.3,.35,.22,.13]),cb=pick(r,CB,[.3,.4,.3]),tk=s.tk*(.7+.6*r()),cn=s.cnt*(.7+.6*r());
  for(const m of MONTHS){if(r()>.88)continue;const n=Math.max(1,Math.round(cn*(.75+.5*r())));
   for(let k=0;k<n;k++){const ch=r()<s.on?'online':'offline',cat=ch==='online'?pick(r,ON,[5,2,2]):pick(r,OFF,s.off);
    const z=(r()+r()+r()-1.5)*1.2,amt=Math.max(1000,Math.round(tk*Math.exp(z)/10)*10);
    tx.push({customer_id:'C'+String(c).padStart(4,'0'),transaction_id:'T'+String(++id).padStart(6,'0'),transaction_date:m+'-'+String(1+Math.floor(r()*28)).padStart(2,'0'),age_group:age,spending_segment:s.n,merchant_category:cat,payment_channel:ch,transaction_amount:amt,cashback_type:cb,cashback_amount:L.txCashback(cb,amt,cat)})}}}
 return tx}
const SQLQ=[
{t:'1. 고객별 월간 결제금액·결제 횟수',p:'고객 단위 월 이용량을 집계해 이용 빈도와 금액의 기초 테이블을 만듭니다.',r:'결제 횟수는 많은데 금액이 작은 고객이 있다면 건당 혜택 구조의 후보로 볼 수 있습니다.',
 q:"SELECT customer_id, substr(transaction_date,1,7) AS month,\n       SUM(transaction_amount) AS total_amount, COUNT(*) AS txn_count\nFROM transactions\nGROUP BY customer_id, month\nORDER BY customer_id, month;"},
{t:'2. 고객 유형별 평균 결제금액',p:'소비 유형별 고객 1인당 월평균 결제금액과 객단가를 비교합니다.',r:'유형 간 객단가 차이가 크면 정률형·건당형 혜택의 적합도가 달라집니다.',
 q:"WITH c AS (\n  SELECT customer_id, spending_segment, substr(transaction_date,1,7) AS month,\n         SUM(transaction_amount) AS amt, COUNT(*) AS n\n  FROM transactions GROUP BY 1,2,3)\nSELECT spending_segment, ROUND(AVG(amt)) AS avg_monthly_amount,\n       ROUND(1.0*SUM(amt)/SUM(n)) AS avg_ticket\nFROM c GROUP BY spending_segment;"},
{t:'3. 캐시백 유형별 비용률',p:'혜택 유형별 결제금액 대비 캐시백 비용률(분모: 결제금액 합계)을 계산합니다.',r:'비용률이 높은 유형은 한도·조건 조정 여부를 검토합니다. 가상 데이터라 절대 수치는 의미가 없습니다.',
 q:"SELECT cashback_type, SUM(transaction_amount) AS spend, SUM(cashback_amount) AS cashback,\n       ROUND(100.0*SUM(cashback_amount)/SUM(transaction_amount),3) AS cost_rate_pct\nFROM transactions GROUP BY cashback_type;"},
{t:'4. 월별 활성 고객 수와 이용금액',p:'월별 결제 1회 이상 고객 수(활성 기준)와 총 이용금액 추이를 봅니다.',r:'활성 고객 수와 금액이 다르게 움직이면 인당 이용액 변화가 원인인지 확인합니다.',
 q:"SELECT substr(transaction_date,1,7) AS month, COUNT(DISTINCT customer_id) AS active_customers,\n       SUM(transaction_amount) AS total_amount,\n       ROUND(1.0*SUM(transaction_amount)/COUNT(DISTINCT customer_id)) AS amount_per_customer\nFROM transactions GROUP BY month ORDER BY month;"},
{t:'5. 고객 세그먼트별 소비 패턴 비교',p:'세그먼트별 월 결제 횟수, 온라인 비중, 혜택 비용률을 한 표에서 비교합니다.',r:'온라인 비중과 결제 횟수가 세그먼트 특성과 일치하는지 검증하는 데 씁니다.',
 q:"SELECT spending_segment, COUNT(DISTINCT customer_id) AS customers,\n       ROUND(1.0*COUNT(*)/(COUNT(DISTINCT customer_id)*3),1) AS txn_per_customer_month,\n       ROUND(100.0*SUM(CASE WHEN payment_channel='online' THEN transaction_amount END)/SUM(transaction_amount),1) AS online_share_pct,\n       ROUND(100.0*SUM(cashback_amount)/SUM(transaction_amount),3) AS cost_rate_pct\nFROM transactions GROUP BY spending_segment;"}];
g.DATA={tx:gen(20261115),gen,SEG,MONTHS,AGES,CB,SQLQ};
})(typeof window!=='undefined'?window:globalThis);
