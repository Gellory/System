const db = require('pro.db');

const DEFAULTS = {
  vmute: {
    'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
    'إيحاءات جنسيه': { reason: 'إيحاءات جنسيه', description: 'إيحاءات غير لائقة', time: '10m' },
    'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
  },
  mute: {
    'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
    'إيحاءات': { reason: 'إيحاءات', description: 'إيحاءات أو مضايقات', time: '15m' },
    'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
  },
  prison: {
    'مشاكل متكرره': { reason: 'مشاكل متكرره', description: 'تكرار المخالفات', time: '6h' },
    'قذف متكرر': { reason: 'قذف متكرر', description: 'تكرار السب او الاتهام', time: '2d' },
    'نشر': { reason: 'نشر', description: 'نشر محتوى محظور', time: 'no limit' },
    'بلاك': { reason: 'بلاك', description: 'حظر دائم', time: 'no limit' }
  }
};

function getReasons(guildId, type) {
  const key = `${type}_reasons_${guildId}`;
  const stored = db.get(key) || {};
  if (Object.keys(stored).length === 0) return { ...DEFAULTS[type] };
  return stored;
}

function setReasons(guildId, type, reasons) {
  const key = `${type}_reasons_${guildId}`;
  db.set(key, reasons);
}

module.exports = { getReasons, setReasons, DEFAULTS };
