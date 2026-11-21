CREATE TABLE IF NOT EXISTS business_xml_feeds (
 id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES users(id), url TEXT NOT NULL,
 approved BOOLEAN NOT NULL DEFAULT FALSE, enabled BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_attempt_at TIMESTAMPTZ,
 last_success_at TIMESTAMPTZ, last_error TEXT,
 UNIQUE(owner_id,url)
);
CREATE TABLE IF NOT EXISTS business_xml_listings (
 feed_id UUID NOT NULL REFERENCES business_xml_feeds(id), external_id TEXT NOT NULL,
 listing_id UUID NOT NULL UNIQUE REFERENCES market_listings(id),
 PRIMARY KEY(feed_id,external_id)
);
