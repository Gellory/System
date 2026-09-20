const Data = require('pro.db');

/**
 * Logs a punishment to the database
 * @param {string} guildId - The ID of the guild where the punishment was issued
 * @param {string} userId - The ID of the user who was punished
 * @param {string} moderatorId - The ID of the moderator who issued the punishment
 * @param {string} type - The type of punishment (mute, ban, kick, warn, etc.)
 * @param {string} reason - The reason for the punishment
 * @param {string} [duration] - Optional duration of the punishment
 */
function logPunishment(guildId, userId, moderatorId, type, reason, duration) {
    const punishId = Date.now();
    const punishment = {
        id: punishId,
        type: type,
        reason: reason,
        moderator: moderatorId,
        timestamp: Date.now(),
        duration: duration || null
    };

    // Get existing punishments or initialize empty array
    const punishments = Data.get(`punish_${guildId}_${userId}`) || [];
    
    // Add new punishment
    punishments.unshift(punishment);
    
    // Save to database (keep last 100 punishments per user)
    Data.set(`punish_${guildId}_${userId}`, punishments.slice(0, 100));
    
    return punishment;
}

/**
 * Removes a punishment from the database
 * @param {string} guildId - The ID of the guild
 * @param {string} userId - The ID of the user
 * @param {string} punishId - The ID of the punishment to remove
 * @returns {boolean} True if a punishment was removed, false otherwise
 */
function removePunishment(guildId, userId, punishId) {
    const punishments = Data.get(`punish_${guildId}_${userId}`) || [];
    const initialLength = punishments.length;
    
    // Filter out the punishment with the given ID
    const updatedPunishments = punishments.filter(p => p.id !== punishId);
    
    if (updatedPunishments.length < initialLength) {
        Data.set(`punish_${guildId}_${userId}`, updatedPunishments);
        return true;
    }
    
    return false;
}

module.exports = {
    logPunishment,
    removePunishment
};
