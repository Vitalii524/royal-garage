const { randomUUID } = require("node:crypto");

const ACTIONS = {
    warning: { label: "Попередження", status: null },
    review: { label: "Профіль на перевірці", status: "review" },
    restrict: { label: "Тимчасове обмеження", status: "restricted" },
    block: { label: "Блокування профілю", status: "blocked" },
    restore: { label: "Доступ відновлено", status: "active" }
};

const PUBLIC_BUSINESS_MODERATION = "(bp.moderation_status <> 'blocked' AND (bp.moderation_status <> 'restricted' OR COALESCE(bp.moderation_until <= NOW(), FALSE)))";

function parseModeration(body, now = Date.now()) {
    const { action, confirmed, until } = body || {};
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!Object.hasOwn(ACTIONS, action) || !reason || reason.length > 1000) return null;
    if ((action === "block" || action === "restrict") && confirmed !== true) return null;
    const expires = action === "restrict" && typeof until === "string" ? Date.parse(until) : NaN;
    if (action === "restrict" && (!Number.isFinite(expires) || expires <= now)) return null;
    return { action, reason, until: action === "restrict" ? new Date(expires).toISOString() : null };
}

async function recordModeration(pool, businessId, adminId, decision) {
    const id = randomUUID();
    const { action, reason, until } = decision;
    const { status, label } = ACTIONS[action];
    const result = await pool.query(
        `WITH previous AS (
            SELECT id, owner_id, moderation_status, moderation_until, moderation_decision_id
            FROM business_profiles WHERE id = $1 AND NOT is_deleted FOR UPDATE
        ), updated AS (
            UPDATE business_profiles bp SET moderation_status = COALESCE($5, p.moderation_status),
                moderation_until = CASE WHEN $5 IS NULL THEN p.moderation_until ELSE $6 END,
                moderation_decision_id = CASE WHEN $5 IS NULL THEN p.moderation_decision_id ELSE $3 END,
                updated_at = NOW()
            FROM previous p WHERE bp.id = p.id
              AND ($8 <> 'review' OR p.moderation_status IN ('active','review')
                    OR (p.moderation_status = 'restricted' AND p.moderation_until <= NOW()))
            RETURNING bp.id, bp.owner_id, bp.moderation_status, bp.moderation_until,
                      p.moderation_status AS old_status, p.moderation_until AS old_until
        ), decision AS (
            INSERT INTO business_moderation_decisions (id,business_id,owner_id,admin_id,action,reason,expires_at)
            SELECT $3,id,owner_id,$2,$8,$4,$6 FROM updated RETURNING id,business_id,owner_id
        ), audit AS (
            INSERT INTO admin_business_audit (business_id,admin_id,action,reason,before_state,after_state)
            SELECT id,$2,'moderation_' || $8,$4,
                   jsonb_build_object('status',old_status,'until',old_until),
                   jsonb_build_object('status',moderation_status,'until',moderation_until,'decisionId',$3)
            FROM updated
        )
        INSERT INTO forum_notifications (id,user_id,actor_id,kind,message,source,url,event_key)
        SELECT $7,owner_id,$2,'business_moderation',$9,'profile','/business-profile.html?moderation=1',
               'moderation:' || id::text FROM decision
        RETURNING id`,
        [businessId, adminId, id, reason, status, until, randomUUID(), action,
            `${label}. Причину й можливість оскарження дивіться в кабінеті бізнесу.`]
    );
    return result.rows.length ? id : null;
}

module.exports = { parseModeration, recordModeration, PUBLIC_BUSINESS_MODERATION };
