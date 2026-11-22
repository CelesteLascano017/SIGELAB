-- OPTIONAL · run manually in the SQL Editor of project SIGELAB (tafggedejddofnpilspx) only.
-- The automated live/e2e tests create requests marked with "[live-test]" / "[e2e]" in the reason and cancel or
-- reject them afterwards (clients cannot delete rows). This removes only those test rows (history and
-- notifications cascade). Demo seed data is NOT touched. Review the SELECT first.
select code, status, reason from public.reservation_requests where reason like '[live-test]%' or reason like '[e2e]%';
-- then, if the list is what you expect:
-- delete from public.reservation_requests where reason like '[live-test]%' or reason like '[e2e]%';
