const ACCESS_FIELDS = `bp.id, bp.owner_id AS "ownerId",
    bt.code AS category, bp.subscription_plan_id AS "planId",
    bp.subscription_expires_at AS "accessUntil",
    bp.complimentary_subscription AS "complimentarySubscription"`;

class AccessChangeError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function parseAccessChange(body, isUuid, now = Date.now()) {
    const { action, planId, until } = body || {};
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason || reason.length > 500) {
        throw new AccessChangeError(400, "Додайте причину зміни (до 500 символів).");
    }

    switch (action) {
        case "standard":
            if (!isUuid(planId || "")) throw new AccessChangeError(400, "Оберіть тариф.");
            return { action, reason, planId };
        case "promotion": {
            const expires = typeof until === "string" && /^\d{4}-\d{2}-\d{2}T/.test(until) ? Date.parse(until) : NaN;
            if (!Number.isFinite(expires) || expires <= now) {
                throw new AccessChangeError(400, "Оберіть майбутню дату завершення.");
            }
            return { action, reason, until: new Date(expires).toISOString() };
        }
        case "grant_complimentary":
        case "revoke_complimentary":
            return { action, reason };
        default:
            throw new AccessChangeError(400, "Невідома дія.");
    }
}

async function changeBusinessAccess(pool, businessId, adminId, change) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const current = await client.query(
            `SELECT ${ACCESS_FIELDS}
             FROM business_profiles bp
             JOIN business_types bt ON bt.id = bp.business_type_id
             JOIN users u ON u.id = bp.owner_id
             WHERE bp.id = $1 AND NOT bp.is_deleted AND NOT u.account_disabled
             FOR UPDATE OF bp`,
            [businessId]
        );
        const before = current.rows[0];
        if (!before) throw new AccessChangeError(404, "Бізнес не знайдено.");

        let planId = before.planId;
        let until = before.accessUntil;
        let complimentary = before.complimentarySubscription;
        if (change.action === "standard") {
            const plan = await client.query(
                "SELECT id FROM subscription_plans WHERE id = $1 AND business_type_code = $2 AND is_active FOR SHARE",
                [change.planId, before.category]
            );
            if (!plan.rows[0]) throw new AccessChangeError(409, "Тариф неактивний або належить іншій категорії.");
            planId = change.planId;
        } else if (change.action === "promotion") {
            const plan = await client.query("SELECT id FROM subscription_plans WHERE id = $1 AND is_active FOR SHARE", [before.planId]);
            if (!plan.rows[0]) throw new AccessChangeError(409, "Спочатку призначте активний тариф.");
            if (until && new Date(until) >= new Date(change.until)) {
                throw new AccessChangeError(409, "Акція має подовжувати чинний термін доступу.");
            }
            until = change.until;
        } else {
            complimentary = change.action === "grant_complimentary";
            if (complimentary === before.complimentarySubscription) {
                throw new AccessChangeError(409, "Цей стан доступу вже встановлено.");
            }
        }

        const updated = await client.query(
            `UPDATE business_profiles SET subscription_plan_id = $2,
                 subscription_expires_at = $3, complimentary_subscription = $4, updated_at = NOW()
             WHERE id = $1
             RETURNING id, owner_id AS "ownerId", subscription_plan_id AS "planId",
                       subscription_expires_at AS "accessUntil", complimentary_subscription AS "complimentarySubscription"`,
            [businessId, planId, until, complimentary]
        );
        const after = updated.rows[0];
        await client.query(
            `INSERT INTO admin_business_audit (business_id, admin_id, action, reason, before_state, after_state)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [businessId, adminId, change.action, change.reason, JSON.stringify(before), JSON.stringify(after)]
        );
        await client.query("COMMIT");
        return after;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { AccessChangeError, parseAccessChange, changeBusinessAccess };
