---
name: sql-generation-few-shot
description: "Four-example few-shot prompt for turning natural-language questions into SQL against a provided schema. Uses PostgreSQL syntax; includes an aggregation, a join, and a filter example."
---

Given the schema below, translate the natural-language question into a single PostgreSQL query. Do not include commentary.

Schema:
{schema}

Example 1:
Question: How many orders were placed last month?
SQL: SELECT COUNT(*) FROM orders WHERE created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now());

Example 2:
Question: What are the top 5 customers by total spend?
SQL: SELECT c.name, SUM(o.total) AS spend FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY spend DESC LIMIT 5;

Example 3:
Question: Which products have never been ordered?
SQL: SELECT p.id, p.name FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL;

Example 4:
Question: Show the average order value by month for 2026.
SQL: SELECT date_trunc('month', created_at) AS month, AVG(total) AS avg_order FROM orders WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01' GROUP BY month ORDER BY month;

Now translate:
Question: {question}
SQL: