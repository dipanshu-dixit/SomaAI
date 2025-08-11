// backend/middleware/cosmicMode.js
// This middleware will optionally wrap analysis.friendly or summary with cosmic flair
function addCosmicTouchToResult(result) {
    if (!result) return result;
    // Only sometimes add a cosmic line (20%-40%)
    if (Math.random() > 0.35) return result;

    const suffixes = [
        "✨ A tiny cosmic note — breathe, we’ll sort this out.",
        "🌿 Remember: small steps today create big changes tomorrow.",
        "☀️ Even storms pass. Take the next small step.",
        "🪐 You’re not alone — we’re on this path together."
    ];
    const pick = suffixes[Math.floor(Math.random() * suffixes.length)];

    return {
        ...result,
        summary: `${result.summary} ${pick}`,
        friendly: result.friendly ? `${result.friendly} ${pick}` : pick
    };
}

module.exports = function cosmicMode(req, res, next) {
    const oldJson = res.json;
    res.json = function (body) {
        try {
            if (body && body.result) {
                body.result = addCosmicTouchToResult(body.result);
            }
        } catch (err) {
            // ignore
        }
        return oldJson.call(this, body);
    };
    next();
};
