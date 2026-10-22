-- ============================================================
-- TCoE Engagement — Day 1 Readiness database schema
-- Run this once to create all tables.
-- ============================================================

CREATE DATABASE IF NOT EXISTS tcoe_engagement
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tcoe_engagement;

-- ── Day 1 prerequisite tracker ────────────────────────────────
CREATE TABLE IF NOT EXISTS d1_prerequisites (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  sno           INT             NOT NULL DEFAULT 0,          -- display sequence number
  area          VARCHAR(100)    NOT NULL,
  description   TEXT            NOT NULL DEFAULT '',          -- newline-delimited bullets
  details       TEXT            NOT NULL DEFAULT '',
  bank_action   TEXT            NOT NULL DEFAULT '',
  qk_action     TEXT            NOT NULL DEFAULT '',
  due_date      DATE            NULL,                         -- NULL = TBD / undated
  status        ENUM('Closed','In-Progress','Planned','Overdue','Not set')
                                NOT NULL DEFAULT 'Not set',
  note          TEXT            NOT NULL DEFAULT '',
  version       INT UNSIGNED    NOT NULL DEFAULT 0,           -- optimistic locking
  created_by    VARCHAR(100)    NOT NULL DEFAULT 'system',
  updated_by    VARCHAR(100)    NOT NULL DEFAULT 'system',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sno  (sno),
  INDEX idx_area (area),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Day 1 mobilisation numbers (heat-map table) ───────────────
CREATE TABLE IF NOT EXISTS d1_mobilisation (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sort_order       INT          NOT NULL DEFAULT 0,
  item_label       VARCHAR(200) NOT NULL,
  day1_value       VARCHAR(200) NOT NULL DEFAULT '',
  full_ramp_value  VARCHAR(200) NOT NULL DEFAULT '',
  updated_by       VARCHAR(100) NOT NULL DEFAULT 'system',
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Readiness observations (single editable text block) ───────
CREATE TABLE IF NOT EXISTS d1_observations (
  id          INT UNSIGNED NOT NULL DEFAULT 1,
  body_html   MEDIUMTEXT   NOT NULL DEFAULT '',
  updated_by  VARCHAR(100) NOT NULL DEFAULT 'system',
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
