/**
 * sign拦截器，保证所有请求必须要进过需要验证才可以进入controller
 */
import logger from "../core/util/logUtil";
const LOGGER = logger.getLogger(module.filename);
const companyTokenService = requireService('companyTokenService');
const userTokenService = requireService('userTokenService');
const userService = requireService('userService');

module.exports.filter = async function (req, res, next) {
	try {
		// 获取请求方法(不是post就是get)
		let method = req.method.toString().toLowerCase();

		// 白名单拦截规则
		let index = _.toInteger(req.url.indexOf('?'));
		index = index ? index : 0;
		let url = req.url;
		if (index > -1) {
			url = req.url.substring(0, index);
		}
		let option = whiteList[url];

		// QPS统计
		recordQPS();

		// 不验证sign，不验证token，完全开放
		if (whiteListItem.noSign === option) {
			next();
			return;
		}

		// 判断是网页还是手机来的访问
		let userAgent = _.toString(req.headers['user-agent']);
		let from = (_.toInteger(userAgent.indexOf('iGatherUp')) <= -1 && _.toInteger(userAgent.indexOf('Java')) <= -1) ? 'web' : 'mobile';
		LOGGER.info('url: %s, from: %s', url, from);

		// 如果是网页的请求，不验证登录=不验证Sign，完全开放
		if (whiteListItem.noLogin === option && from === 'web') {
			next();
			return;
		}

		// 只验证sign，不验证token
		// 一定要输入时间
		req.params = _.merge(req.body, req.query);
		let time = _.toInteger(req.params.time);
		time = time ? time : 0;
		if (!time) {
			LOGGER.warn('time is empty! url: %s, data: %s', url, JSON.stringify(req.params));
			sendError(ErrorCode.systemError.parameterError, res);
			return;
		}

		// 接下来的都要验证sign的
		let sign = req.params.sign;
		if (!sign) {
			LOGGER.warn('sign is empty! url: %s, data: %s', url, JSON.stringify(req.params));
			sendError(ErrorCode.systemError.parameterError, res);
			return;
		}

		// 如果是手机来的请求，sign的长度一定是32位(因为是md5加密的)
		if (from === 'mobile' && _.toInteger(sign.length) != 32) {
			LOGGER.warn('sign\'s length is not equals 32, url: %s, data: %s', url, JSON.stringify(req.params));
			sendError(ErrorCode.systemError.parameterError, res);
			return;
		}

		// 如果是手机来的请求，要验证sign
		let token = '';
		if (from === 'mobile') {
			// 删除sign字段，重新算一次
			delete req.params['sign'];
			let serverSign = '';

			// 计算sign值
			let tmp = [];
			for (let value in req.params) {
				tmp.push({'key': value});
			}
			tmp = _.sortBy(tmp, function (o) {
				return o.key;
			});
			let valueString = '';
			_.forEach(tmp, function (a) {
				let str = req.params[a.key].toString().trim();
				if (method === 'post') {
					valueString += str;
				} else {
					valueString += str;
				}
			});
			valueString += properties['system.key'];
			serverSign = secret.md5(valueString);
			if (sign !== serverSign) {
				LOGGER.warn("sign error! url: %s, client: %s, server: %s", url, sign, serverSign);
				sendError(ErrorCode.systemError.parameterError, res);
				return;
			}
		} else {
			if (method === 'post') {
				token = req.params.token;
				if (!token) {
					LOGGER.warn('token is empty! url: %s, data: %s', url, JSON.stringify(req.params));
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}

				// 如果是网页来的请求，sign=token
				if (token !== sign) {
					LOGGER.warn('token is not equals sign! url: %s, data: %s', url, JSON.stringify(req.params));
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}
			}
			token = sign;

			// 验证token
			token = tokenRSAService.rsaDecrypt(token);

			// 验证一下字符串是否符合约定好的规则
			// rsa(token+gatherup+timestamp+udid)
			let arr = token.split('+');
			if (_.toInteger(arr.length) !== 4) {
				LOGGER.warn('token parse arr length != 4, token: %s', token);
				sendError(ErrorCode.systemError.parameterError, res);
				return;
			}
		}

		if (whiteListItem.noLogin === option) {
			next();
			return;
		}

		// 如果既没有userId也没有companyId，就是非法请求
		if (method === 'post') {
			let version = _.toInteger(req.params.version);
			if (version < 241) {
				LOGGER.warn("version is too old, url: %s, data: %s", url, JSON.stringify(req.params));
				sendError(ErrorCode.systemError.versionOldError, res);
				return;
			}

			// 用户id(app必传)
			let userId = _.toInteger(req.params.userId);
			userId = userId ? userId : 0;

			// 企业id(官网)
			let companyId = _.toInteger(req.params.companyId);
			companyId = companyId ? companyId : 0;

			// openId(网红平台必传)
			let openId = _.toString(req.params.openId);

			if (userId <= 0 && companyId <= 0 && !openId) {
				if (userId <= 0) {
					LOGGER.warn("userId is empty, url: %s, data: %s", url, JSON.stringify(req.params));
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}

				if (companyId <= 0) {
					LOGGER.warn("companyId is empty, url: %s, data: %s", url, JSON.stringify(req.params));
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}

				if (!openId) {
					LOGGER.warn("openId is empty, url: %s, data: %s", url, JSON.stringify(req.params));
					sendError(ErrorCode.systemError.tokenInvalid, res);
					return;
				}
			}

			let user;
			if (userId > 0) {
				user = await getUser(userId);
				if (!user) {
					LOGGER.warn("user not exists, version: %s, url: %s, userId: %s", url, userId, version);
					sendError(ErrorCode.userError.userNotExists, res);
					return;
				}

				// 判断封号
				if (user.status == 1) {
					LOGGER.warn("user %s was ban", user.id);
					return ErrorCode.userError.userTokenInvalid;
				}
			}

			// 验证token
			token = decodeURIComponent(req.params.token).trim();
			if (!token) {
				LOGGER.warn('token is empty! url: %s, data: %s', url, JSON.stringify(req.params));
				sendError(ErrorCode.systemError.parameterError, res);
				return;
			}

			// 解析token
			token = tokenRSAService.rsaDecrypt(token);

			// 验证一下字符串是否符合约定好的规则
			// rsa(token+gatherup+timestamp+udid)
			let arr = token.split('+');
			if (_.toInteger(arr.length) !== 4) {
				LOGGER.warn('token parse arr length != 3 or length != 4, token: %s', token);
				sendError(ErrorCode.systemError.parameterError, res);
				return;
			}

			if ('gatherup' !== arr[1]) {
				LOGGER.warn("token format error, gatherup not equals, url: %s, data: %s", url, arr);
				sendError(ErrorCode.userError.userTokenInvalid, res);
				return;
			}

			// 验证timestamp
			let timestamp = _.toInteger(arr[2]);
			timestamp = timestamp ? timestamp : 0;
			if (timestamp <= 0) {
				LOGGER.warn('token is empty! url: %s, data: %s', url, JSON.stringify(req.params));
				sendError(ErrorCode.systemError.parameterError, res);
				return;
			}

			// 获取 udid
			let udid = _.toString(arr[3]).trim();
			if (!udid || udid.length != 32) {
				LOGGER.warn('udid is error! url: %s, data: %s', url, JSON.stringify(req.params));
				sendError(ErrorCode.systemError.parameterError, res);
				return;
			}

			// 解析token
			let clientToken = jwtUtil.verify(_.toString(arr[0]).trim());

			// 验证token的是否存在(兼容userId、companyId、openId)

			// 用户id(app必检查)
			let tokenUserId = _.toInteger(clientToken['userId']);
			tokenUserId = tokenUserId ? tokenUserId : 0;

			// 企业id(官网必检查)
			let tokenCompanyId = _.toInteger(clientToken['companyId']);
			tokenCompanyId = tokenCompanyId ? tokenCompanyId : 0;

			// openId(网红平台必检查)
			let tokenOpenId = _.toString(clientToken['openId']).trim();

			if (tokenUserId <= 0 && tokenCompanyId <= 0 && !tokenOpenId) {
				if (tokenUserId <= 0) {
					LOGGER.warn("can not find userId in token, url: %s, token: %s, data: %s", url, JSON.stringify(clientToken), JSON.stringify(req.params));
					sendError(ErrorCode.userError.userTokenInvalid, res);
					return;
				}

				if (tokenCompanyId <= 0) {
					LOGGER.warn("can not find companyId in token, url: %s, token: %s, data: %s", url, JSON.stringify(clientToken), JSON.stringify(req.params));
					sendError(ErrorCode.companyError.companyTokenInvalid, res);
					return;
				}

				if (!tokenOpenId) {
					LOGGER.warn("can not find tokenOpenId in token, url: %s, token: %s, data: %s", url, JSON.stringify(clientToken), JSON.stringify(req.params));
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}

				// 包头的userId和token的userId要一样
				if (userId !== tokenUserId) {
					LOGGER.warn('userId !== tokenUserId! url: %s, userId: %s, tokenUserId: %s', url, userId, tokenUserId);
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}

				// 包头的companyId和token的companyId要一样
				if (companyId !== tokenCompanyId) {
					LOGGER.warn('companyId!==tokenCompanyId! url: %s, companyId: %s, tokenCompanyId: %s', url, companyId, tokenCompanyId);
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}

				// 包头的openId和token的openId要一样
				if (openId !== tokenOpenId) {
					LOGGER.warn('openId!==tokenOpenId! url: %s, openId: %s, tokenOpenId: %s', url, openId, tokenOpenId);
					sendError(ErrorCode.systemError.parameterError, res);
					return;
				}
			}

			// 验证用户的token
			let now = timeUtil.now();
			if (tokenUserId > 0) {
				let userToken = await userTokenService.getToken(tokenUserId);
				if (!userToken) {
					LOGGER.warn("user token not exists, url: %s, userId: %s, token: %s", url, tokenUserId, clientToken);
					sendError(ErrorCode.userError.userTokenInvalid, res);
					return;
				}

				// 验证token是否过期
				if (userToken.expire <= now) {
					LOGGER.warn("token expire! url: %s, userId: %s, token: %s, expire at: %s", url, tokenUserId, token, timeUtil.time2str(userToken.expire, 'YYYY-MM-DD HH:mm:ss'));
					sendError(ErrorCode.userError.userTokenInvalid, res);
					return;
				}

				// 判断token的环境是不是一样
				let clientEnv = clientToken['env'];
				if (userTokenService.tokenEnv() !== clientEnv) {
					LOGGER.warn("client token's env is not equals server! url: %s, server env: %s, client env: %s", url, userTokenService.tokenEnv(), clientEnv);
					sendError(ErrorCode.userError.userTokenInvalid, res);
					return;
				}

				// 验证两个最后登录时间是不是一样
				let serverToken = userTokenService.decryptToken(userToken.token);
				if (!serverToken) {
					LOGGER.warn("server token decrypt error, url: %s, token: %s", url, userToken.token);
					sendError(ErrorCode.userError.userTokenInvalid, res);
					return;
				}

				// 记作一次在线
				userService.recordUserOnline(userId);
			}

			// 验证企业的token
			if (tokenCompanyId > 0) {
				let companyToken = await companyTokenService.getToken(tokenCompanyId);
				if (!companyToken) {
					LOGGER.warn("company token not exists, companyId: %s, token: %s", tokenCompanyId, clientToken);
					sendError(ErrorCode.companyError.companyTokenInvalid, res);
					return;
				}

				// 验证token是否过期
				if (companyToken.expire <= now) {
					LOGGER.warn("token expire! companyId: %s, token: %s, expire at: %s", tokenCompanyId, token, timeUtil.date(companyToken.expire));
					sendError(ErrorCode.companyError.companyTokenInvalid, res);
					return;
				}

				// 验证两个最后登录时间是不是一样
				let serverToken = userTokenService.decryptToken(companyToken.token);
				if (!serverToken) {
					LOGGER.warn("server token decrypt error, token: %s", companyToken.token);
					sendError(ErrorCode.companyError.companyTokenInvalid, res);
					return;
				}

				let clientLastLogin = _.toInteger(clientToken["lastLogin"]);
				clientLastLogin = clientLastLogin ? clientLastLogin : 0;
				let serverLastLogin = _.toInteger(serverToken["lastLogin"]);
				serverLastLogin = serverLastLogin ? serverLastLogin : 0;
				if (clientLastLogin !== serverLastLogin) {
					LOGGER.warn("other login this account! companyId: %s", tokenCompanyId);
					LOGGER.warn("url: %s, clientLastLogin: %s, serverLastLogin: %s", url, timeUtil.time2str(clientLastLogin, "YYYY-MM-DD HH:mm"), timeUtil.time2str(serverLastLogin, "YYYY-MM-DD HH:mm"));
					sendError(ErrorCode.companyError.otherLoginError, res);
					return;
				}
			}

			// 验证openId
			if (tokenOpenId) {
				// token是否过期
				let expire = _.toInteger(clientToken["expire"]);
				let now = timeUtil.now();
				if (expire <= now) {
					LOGGER.warn("token decrypt error, token: %s", JSON.stringify(clientToken));
					sendError(ErrorCode.systemError.tokenInvalid, res);
					return;
				}
			}
		}
	} catch (e) {
		LOGGER.error(e);
		sendError(ErrorCode.systemError.unknowError, res);
		if (filesystem.isLinux()) {
			let isDEV = properties['system.env'] === 'dev';
			mailUtil.send("nodejs" + (isDEV ? '-test' : '') + " 服务器发生错误", '<pre>' + e.stack + '</pre>', "ruanzhijun@gatherup.cc");
		}
		return;
	}

	next();
};

/**
 * 发送错误信息
 * @param errorCode 错误码对象
 * @param res res对象
 */
function sendError(errorCode, res) {
	let json = {};
	json['time'] = timeUtil.now();
	json['status'] = _.toInteger(errorCode.errorCode);
	json['errorMsg'] = errorCode.errorMessage.toString();
	res.json(json);
}

/**
 * 记录QPS统计
 */
async function recordQPS() {
	// 开发环境不记录qps
	if (properties['system.env'] === 'dev') {
		return;
	}

	let key = KeyFactory.nodejsQPSKey(timeUtil.now());
	await redis.STRINGS.incrby(key, 1);
	await redis.KEYS.expire(key, 600);
}

/**
 * 包头验证用户id
 * @param userId 用户id
 */
async function getUser(userId) {
	return await cacheUtil.get('signFilter:' + userId, 3600, userService.getUserById, userId);
}