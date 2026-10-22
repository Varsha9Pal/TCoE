-- ============================================================
-- TCoE Engagement — Day 1 Readiness seed data
-- Seeded from the prototype DATA.day1 array (30 items).
-- Run AFTER schema.sql. Safe to re-run (uses INSERT IGNORE).
-- ============================================================

USE tcoe_engagement;

-- ── Prerequisites (30 rows) ───────────────────────────────────
-- Columns: sno, area, description, details, bank_action, qk_action,
--          due_date, status, note, created_by, updated_by

INSERT IGNORE INTO d1_prerequisites
  (id, sno, area, description, details, bank_action, qk_action, due_date, status, note, version, created_by, updated_by)
VALUES
-- 1 Proposal
(1, 1, 'Proposal',
 'v1.7 final version; 3-year engagement with agreed KPIs',
 '', '', '',
 '2026-10-05', 'Closed', '', 0, 'seed', 'seed'),

-- 2 SOW
(2, 2, 'SOW',
 'Shared on 12 Oct; KPIs & SLAs in review\nTo be aligned with SDG Heads',
 '',
 'Confimatin on application list\nsend SOW for review to larger audience',
 '',
 '2026-10-23', 'In-Progress', '', 0, 'seed', 'seed'),

-- 3 LOI
(3, 3, 'LOI',
 'LO to start Engagement from 1 Nov \'26',
 '', '', '',
 '2026-10-18', 'Planned', '', 0, 'seed', 'seed'),

-- 4 PO
(4, 4, 'PO',
 'PO for agreed duration',
 '', '', '',
 '2026-10-30', 'Planned', '', 0, 'seed', 'seed'),

-- 5 Project Kickoff
(5, 5, 'Project Kickoff',
 'Meeting to be scheduled',
 '',
 'Tentative last week of Oct\'26',
 'walkthorugh of Project kickoff',
 NULL, 'Not set', '', 0, 'seed', 'seed'),

-- 6 Logistics
(6, 6, 'Logistics',
 'Seating arrangements',
 'Atleast 53 starting 1st Nov (New staff)\nMumbai - 44\nHydrabad - 6\nChennai - 1\nDelhi - 2',
 'a. Sheet name "Location & application mapping "\nb. Vertical Head wise Day 1 loading has to be informed internally and KT plan has to be created for BAU replacement resources',
 '',
 NULL, 'Planned', '', 0, 'seed', 'seed'),

-- 7 ID creation
(7, 7, 'ID creation',
 'ID creation request for Day 1 resources',
 'takes 1 week time, target by last week\ntentative 23rd Oct start',
 '',
 'Name\nMobile number\nEmail Id\nUnit & Vertical Head\nApplication Name',
 NULL, 'Not set', '', 0, 'seed', 'seed'),

-- 8 Assets - VPN
(8, 8, 'Assets',
 'VPN access',
 'VPN access as interim arrangement during KT sessions',
 'To check VPN access till laptops are procured',
 '',
 NULL, 'Not set', '', 0, 'seed', 'seed'),

-- 9 Assets - Laptops
(9, 9, 'Assets',
 'Laptops',
 'Total 135 by end of month 3\nInitially 92 i5 / i7 16 GB in Month 1\n15 i7 out of 92',
 'Existing resources laptop configuration at each resource level',
 'QK team will be onboarded with laptops',
 '2026-10-31', 'Planned', '', 0, 'seed', 'seed'),

-- 10 Application access
(10, 10, 'Application access',
 'Access to required applications',
 'as per man to man mapping',
 '',
 'Application mapping sheet',
 '2026-11-01', 'Planned', '', 0, 'seed', 'seed'),

-- 11 Headcount
(11, 11, 'Headcount',
 'Revised Headcount',
 'Revise head count from 110 to new one towerwise to be shared',
 '',
 'QK to update this file with Rebadging status',
 '2026-10-23', 'Planned', '', 0, 'seed', 'seed'),

-- 12 Transition Plan
(12, 12, 'Transition Plan',
 'Notice period of exising staff 110',
 '110 - QK (27 staff)',
 '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 13 Tool - TestSigma
(13, 13, 'Tool',
 'TestSigma',
 '135 licenses',
 '', '',
 '2026-11-01', 'Planned', '', 0, 'seed', 'seed'),

-- 14 Tool - JIRA
(14, 14, 'Tool',
 'JIRA',
 '135 licenses',
 '', '',
 '2026-11-01', 'Planned', '', 0, 'seed', 'seed'),

-- 15 KT / Transition
(15, 15, 'KT / Transition',
 'Detailed KT Plan to be shared\nSDG Owner name against each 110 existing staff',
 'Transition for 100 member team',
 '',
 'KT Plan to enable QK asign resource with TM/TL\nresources',
 '2026-10-21', 'Planned', '', 0, 'seed', 'seed'),

-- 16 Automation
(16, 16, 'Automation',
 'Pragati APK for automation',
 '', '',
 'Loop Ravi S on email',
 '2026-10-19', 'Planned', '', 0, 'seed', 'seed'),

-- 17 RTM
(17, 17, 'RTM',
 'Existing Collatrals from SDGs in one single folder per application per tower',
 'BRD\nCustomization CR documents\nInflight CRs with plans and currrent status of Inflight CRs\nTest Cases\nDefects\nRegression pack per application\nExisting RTM',
 'Ravi to Initiate with SDG team',
 '',
 '2026-10-31', 'Planned', '', 0, 'seed', 'seed'),

-- 18 KPI
(18, 18, 'KPI',
 'Last 3 months production defects extract',
 '', '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 19 AI Strategy
(19, 19, 'AI Stategy',
 'Approvals for LLM usage with Testsigma',
 '', '', '',
 '2026-11-01', 'Planned', '', 0, 'seed', 'seed'),

-- 20 Test Data
(20, 20, 'Test Data',
 'List of database and access to database access for Test Data role',
 '', '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 21 Testing SOP
(21, 21, 'Testing SOP',
 'Current System touchpoint with users and application touchpoints\nTest Strategy\nSignoff process / reviews\nDefect Lifecycle\nCurrent Test Data strategy & appraoch',
 '', '', '',
 '2026-11-16', 'Planned', '', 0, 'seed', 'seed'),

-- 22 CR data
(22, 22, 'CR data',
 'Last 6 months CR data application wise',
 '', '', '',
 '2026-11-16', 'Planned', '', 0, 'seed', 'seed'),

-- 23 CR Demand
(23, 23, 'CR Demand',
 'Next 3 months CR aapplication wise',
 '', '', '',
 '2026-11-16', 'Planned', '', 0, 'seed', 'seed'),

-- 24 Governance
(24, 24, 'Governance',
 'Meeting with Vikas',
 'to strart with 2 time in a week and then weekly once',
 'Himanshu to speak with Vikas on this and Ravi S to schedule',
 '',
 '2026-10-17', 'Planned', '', 0, 'seed', 'seed'),

-- 25 Governance forums
(25, 25, 'Governance forums',
 'Agree daily/weekly/monthly governance forums',
 'Daily syncup with Core Group Bank + QK\nWeekly: Himanshu + SDG heads\nFortnightly: SDG heads\nMonthly Steerco: Vikas → Vivek P, Ravi G\nQuarterly CXO connect',
 '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 26 API Inventory
(26, 26, 'API Inventory',
 'Provide API inventory, Swagger/OpenAPI specifications, endpoints, authentication, certificates, test accounts and consumer/producer dependency details.',
 '', '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 27 Authentication and control bypasses
(27, 27, 'Authentication and control bypasses',
 'Approve the use of static OTP and agreed test bypasses for CAPTCHA, biometric and MDM controls where automation is not feasible; document security controls.',
 '', '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 28 Source control and pipelines
(28, 28, 'Source control and pipelines',
 'Provide approved repositories, branching strategy, build agents, pipeline access, secrets management and deployment hooks for automation assets.',
 '', '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 29 Technical support contacts
(29, 29, 'Technical support contacts',
 'Provide named DBA, OS, application administrator, network, infrastructure, Environment Support, OEM Suport Contact, production support and development contacts for each tower/application.',
 '', '', '',
 '2026-11-10', 'Planned', '', 0, 'seed', 'seed'),

-- 30 Tool - Power BI
(30, 30, 'Tool',
 'Power BI licenses',
 '2 developer licenses',
 '', '',
 '2026-11-16', 'Planned', '', 0, 'seed', 'seed');

-- ── Mobilisation numbers (7 rows) ──────────────────────────────
INSERT IGNORE INTO d1_mobilisation (id, sort_order, item_label, day1_value, full_ramp_value, updated_by)
VALUES
(1, 1, 'Seats required',                        '53 from 1 Nov',              '—',                         'seed'),
(2, 2, 'Mumbai / Hyderabad / Chennai / Delhi',   '44 / 6 / 1 / 2',            '—',                         'seed'),
(3, 3, 'Laptops',                               '92 in month 1 (15 i7)',      '135 by end of month 3',     'seed'),
(4, 4, 'TestSigma licences',                    '—',                          '135',                       'seed'),
(5, 5, 'JIRA licences',                         '—',                          '135',                       'seed'),
(6, 6, 'Power BI licences',                     '—',                          '2 developer',               'seed'),
(7, 7, 'Staff in transition scope',             '110 existing (27 already QK)','Head-count under revision','seed');

-- ── Observations text (initial prototype content) ──────────────
INSERT IGNORE INTO d1_observations (id, body_html, updated_by) VALUES (1,
'<p><b>More falls due after go-live than before it.</b> 16 of the 30 prerequisites are dated November 2026
or later, against 10 in October. Items such as application access, tool licences
and the AI/LLM approval are dated 1 November — the same day the team starts — which leaves no float if any of
them slips. Pulling the access and licence items into October would de-risk the first week materially.</p>
<p><b>4 items are already past due</b> as at 22 October: LOI, KT / Transition, Automation, Governance.
The LOI in particular gates the 1 November start, and the KT plan drives the transition of the existing team.</p>
<p><b>4 items carry no due date</b> (Project Kickoff, Logistics, ID creation, Assets), and
3 have no status recorded. Seating is among the undated ones, yet it needs
53 desks on 1 November. These should be dated before the next governance call.</p>
<p><b>Ownership is thin on the page.</b> 18 of the 30 rows name neither a Bank nor a QK action,
so accountability has to be inferred from the area. Adding a named owner per line — rather than per column —
would make the tracker usable in the daily core-group sync proposed under item 25.</p>
<p><b>Head-count still moving.</b> Item 11 revises the figure from 110 towards a new tower-wise number, and item 12 puts
27 of the 110 already with QK. The Current State Team tab in this page lists
115 testers, so the three figures (110, 115 and the revised number) need to be reconciled before the PO
and licence counts of 135 are locked.</p>
<p><b>Tooling.</b> 3 tool items are tracked — TestSigma and JIRA at 135 licences each and Power BI at 2 —
and the licence count of 135 matches the month-3 laptop number rather than the 115 testers in the current-state
sheet, implying planned growth that should be confirmed in the SOW.</p>',
'seed');
