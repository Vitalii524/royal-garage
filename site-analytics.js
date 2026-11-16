const jwt = require("jsonwebtoken");

const tokenUrl = "https://oauth2.googleapis.com/token";
const cacheDuration = 5 * 60 * 1000;
let cached;
let pending;

async function readReport(propertyId, email, privateKey, hostname) {
    const assertion = jwt.sign({
        scope: "https://www.googleapis.com/auth/analytics.readonly"
    }, privateKey, { algorithm: "RS256", issuer: email, audience: tokenUrl, expiresIn: "5m" });
    const auth = await fetch(tokenUrl, {
        method: "POST",
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion
        }),
        signal: AbortSignal.timeout(10000)
    });
    if (!auth.ok) throw new Error("Google OAuth HTTP " + auth.status);
    const { access_token } = await auth.json();
    if (!access_token) throw new Error("Google OAuth did not return an access token");

    const response = await fetch(
        "https://analyticsdata.googleapis.com/v1beta/properties/" + propertyId + ":runReport",
        {
            method: "POST",
            headers: { Authorization: "Bearer " + access_token, "Content-Type": "application/json" },
            body: JSON.stringify({
                dateRanges: [
                    { name: "week", startDate: "7daysAgo", endDate: "yesterday" },
                    { name: "month", startDate: "30daysAgo", endDate: "yesterday" }
                ],
                metrics: ["activeUsers", "sessions", "screenPageViews"].map(name => ({ name })),
                dimensionFilter: {
                    filter: { fieldName: "hostName", stringFilter: { matchType: "EXACT", value: hostname } }
                }
            }),
            signal: AbortSignal.timeout(10000)
        }
    );
    if (!response.ok) throw new Error("GA4 Data API HTTP " + response.status);

    const report = await response.json();
    const empty = { activeUsers: 0, sessions: 0, pageViews: 0 };
    const periods = { week: { ...empty }, month: { ...empty } };
    for (const row of report.rows || []) {
        const range = row.dimensionValues?.[0]?.value;
        if (range !== "week" && range !== "month") continue;
        const [activeUsers, sessions, pageViews] = row.metricValues.map(metric => Number(metric.value));
        periods[range] = { activeUsers, sessions, pageViews };
    }
    return periods;
}

module.exports = async function getSiteAnalytics(hostname) {
    const propertyId = process.env.GA4_PROPERTY_ID?.trim();
    const email = process.env.GA4_CLIENT_EMAIL?.trim();
    const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
    if (!/^\d+$/.test(propertyId || "") || !email || !privateKey) return null;

    if (cached && cached.expiresAt > Date.now()) return cached.periods;
    if (!pending) {
        pending = readReport(propertyId, email, privateKey, hostname).then(periods => {
            cached = { periods, expiresAt: Date.now() + cacheDuration };
            return periods;
        }).finally(() => { pending = undefined; });
    }
    return pending;
};
