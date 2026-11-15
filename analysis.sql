-- 가상(Synthetic) 데이터 기준 SQLite 쿼리. transactions 테이블은 웹사이트의 CSV를 가져오면 생성됩니다.
-- .mode csv / .import transactions.csv transactions

-- 1. 고객별 월간 결제금액·결제 횟수
-- 목적: 고객 단위 월 이용량을 집계해 이용 빈도와 금액의 기초 테이블을 만듭니다.
SELECT customer_id, substr(transaction_date,1,7) AS month,
       SUM(transaction_amount) AS total_amount, COUNT(*) AS txn_count
FROM transactions
GROUP BY customer_id, month
ORDER BY customer_id, month;

-- 2. 고객 유형별 평균 결제금액
-- 목적: 소비 유형별 고객 1인당 월평균 결제금액과 객단가를 비교합니다.
WITH c AS (
  SELECT customer_id, spending_segment, substr(transaction_date,1,7) AS month,
         SUM(transaction_amount) AS amt, COUNT(*) AS n
  FROM transactions GROUP BY 1,2,3)
SELECT spending_segment, ROUND(AVG(amt)) AS avg_monthly_amount,
       ROUND(1.0*SUM(amt)/SUM(n)) AS avg_ticket
FROM c GROUP BY spending_segment;

-- 3. 캐시백 유형별 비용률
-- 목적: 혜택 유형별 결제금액 대비 캐시백 비용률(분모: 결제금액 합계)을 계산합니다.
SELECT cashback_type, SUM(transaction_amount) AS spend, SUM(cashback_amount) AS cashback,
       ROUND(100.0*SUM(cashback_amount)/SUM(transaction_amount),3) AS cost_rate_pct
FROM transactions GROUP BY cashback_type;

-- 4. 월별 활성 고객 수와 이용금액
-- 목적: 월별 결제 1회 이상 고객 수(활성 기준)와 총 이용금액 추이를 봅니다.
SELECT substr(transaction_date,1,7) AS month, COUNT(DISTINCT customer_id) AS active_customers,
       SUM(transaction_amount) AS total_amount,
       ROUND(1.0*SUM(transaction_amount)/COUNT(DISTINCT customer_id)) AS amount_per_customer
FROM transactions GROUP BY month ORDER BY month;

-- 5. 고객 세그먼트별 소비 패턴 비교
-- 목적: 세그먼트별 월 결제 횟수, 온라인 비중, 혜택 비용률을 한 표에서 비교합니다.
SELECT spending_segment, COUNT(DISTINCT customer_id) AS customers,
       ROUND(1.0*COUNT(*)/(COUNT(DISTINCT customer_id)*3),1) AS txn_per_customer_month,
       ROUND(100.0*SUM(CASE WHEN payment_channel='online' THEN transaction_amount END)/SUM(transaction_amount),1) AS online_share_pct,
       ROUND(100.0*SUM(cashback_amount)/SUM(transaction_amount),3) AS cost_rate_pct
FROM transactions GROUP BY spending_segment;
