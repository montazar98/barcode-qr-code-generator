-- ==========================================================
-- Cloudflare D1 Analytics Database Schema
-- Database Name: barcode-analytics
-- Compatible with Cloudflare D1 (SQLite-based distributed DB)
-- ==========================================================

CREATE TABLE IF NOT EXISTS analytics_visits (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  ip_hash TEXT,
  country_code TEXT DEFAULT 'XX',
  country_name_ar TEXT,
  country_name_en TEXT,
  flag_emoji TEXT DEFAULT '🌐',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  device_type TEXT DEFAULT 'desktop',
  browser TEXT DEFAULT 'Other',
  os TEXT DEFAULT 'Other',
  referrer TEXT DEFAULT 'Direct / مباشر',
  page_path TEXT DEFAULT '/',
  language TEXT DEFAULT 'ar',
  user_agent TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_visits (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_id ON analytics_visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_visits (country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_device ON analytics_visits (device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_visits (created_at);
