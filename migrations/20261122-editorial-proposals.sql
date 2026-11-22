CREATE TABLE IF NOT EXISTS editorial_proposals (
    recipient_id UUID PRIMARY KEY REFERENCES users(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_name TEXT NOT NULL,
    message_id UUID NOT NULL UNIQUE,
    proposal_text TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
