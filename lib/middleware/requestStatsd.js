// requestStatsd middleware
const LOGGER = getLogger('core.middleware.requestStatsd');
const timeUtil = require('../utils/time');
const number = require('../utils/number');

function time(start) {
  const delta = timeUtil.nowMillisecond() - start;
  return number.humanize(delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`);
}

function log(...str) {
  LOGGER.info(...str);
}

module.exports = () => async function (ctx, next) {
  const start = timeUtil.nowMillisecond();
  await next();
  const cost = time(start);
  log(`${ctx.status} ${ctx.path} ${cost}`);
};
