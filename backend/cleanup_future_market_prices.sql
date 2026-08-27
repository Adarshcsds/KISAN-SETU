-- Review first. This file does not delete anything by itself.
SELECT date, commodity, COUNT(*) AS records
FROM market_prices
WHERE date > CURRENT_DATE
GROUP BY date, commodity
ORDER BY date, commodity;

-- After reviewing the result and taking a database backup, run this manually:
-- BEGIN;
-- DELETE FROM market_prices WHERE date > CURRENT_DATE;
-- COMMIT;
