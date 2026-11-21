-- Additive migration. No existing profiles, prices, rights or products are updated.
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS crm_enabled BOOLEAN;
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS order_telegram TEXT NOT NULL DEFAULT '';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS order_viber TEXT NOT NULL DEFAULT '';
ALTER TABLE business_products ADD COLUMN IF NOT EXISTS order_chat BOOLEAN NOT NULL DEFAULT TRUE;
INSERT INTO business_types(id,code,name) VALUES ('88888888-8888-4888-8888-888888888888','wholesale','Гуртівня') ON CONFLICT(code) DO NOTHING;
INSERT INTO subscription_plans(id,business_type_code,code,name,price_uah,car_limit,has_crm,has_map,is_active)
VALUES(gen_random_uuid(),'wholesale','business','Business',1500,NULL,FALSE,TRUE,TRUE)
ON CONFLICT(business_type_code,code) DO NOTHING;
