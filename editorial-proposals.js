const { randomUUID } = require("node:crypto");

async function recordProposal(pool, { senderId, recipientId, recipientName, text }) {
    const messageId = randomUUID();
    const result = await pool.query(
        `WITH proposal AS (
            INSERT INTO editorial_proposals (recipient_id, sender_id, recipient_name, message_id, proposal_text)
            SELECT u.id, $1, bp.name, $4, $5
            FROM users u JOIN business_profiles bp ON bp.owner_id = u.id
            WHERE u.id = $2 AND bp.name = $3 AND NOT u.account_disabled AND NOT bp.is_deleted
            ON CONFLICT (recipient_id) DO NOTHING
            RETURNING sender_id, recipient_id, message_id, proposal_text
         )
         INSERT INTO chat_messages (id, sender_id, receiver_id, text)
         SELECT message_id, sender_id, recipient_id, proposal_text FROM proposal
         RETURNING id`,
        [senderId, recipientId, recipientName, messageId, text]
    );
    return result.rows[0]?.id || null;
}

module.exports = { recordProposal };
