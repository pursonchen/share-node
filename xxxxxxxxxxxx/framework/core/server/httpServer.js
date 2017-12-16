// http服务器
import logger from "../util/logUtil";
import compression from "compression";
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
let LOGGER = logger.getLogger(module.filename);

let app = express();

// 支持bodyParser
try {
	app.use(compression({level: 9}));
	app.use(bodyParser.json({limit: '1mb'}));// 限制请求大小
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(session({
		secret: properties["system.key"],
		name: secret.sha1(properties["project.name"] + properties["system.key"] + 'captcha'),   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
		cookie: {maxAge: 300000},  //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
		path: "/" + properties["project.name"].substring(3),
		resave: false,
		saveUninitialized: true
	}));
} catch (e) {
	LOGGER.error(e);
	process.exit();
}

// 加载拦截器(自动加载系统默认的拦截器和应用程序自定义的拦截器)
// 如果应用程序有filter.config文件，则按照该文件的顺序加载拦截器
try {
	let filterConfigPath = AppDir + '/filer.config';
	if (filesystem.exists(filterConfigPath)) {
		let filterConfig = filesystem.read(filterConfigPath);
		let systemFiltersPath = CoreDir + '/framework/filter/';
		filterConfig.split(',').forEach(function (item) {
			let filter = require(systemFiltersPath + item);
			app.use(async function (req, res, next) {
				await filter.filter(req, res, next)
			});
			LOGGER.warn('load filter %s', item.replace('.js', ''));
		});
	}
} catch (e) {
	LOGGER.error(e);
	process.exit();
}

/**
 * 启动http服务器
 */
module.exports.start = function (port, route) {
	// 遍历路由，映射到具体方法
	_.forEach(route, function (v_map, k_url) {
		var func = async function (req, res) {
			// 调用映射的方法处理并返回
			var json = {};

			// 调用处理方法
			try {
				// 把post、get、restful获得的参数都合成到一个变量中，控制层直接用key拿参数就好，不需要考虑是来自哪种方式
				let tmp = req.params;
				req.params = _.merge(req.body, req.query, tmp);

				// get请求才decode
				if (v_map.method == 'get') {
					_.forEach(req.params, function (v, k) {
						req.params[decodeURIComponent(k).trim()] = decodeURIComponent(decodeURIComponent(v)).trim();
					});
				}

				// 通过token获取udid
				let token = decodeURIComponent(_.toString(req.params.token)).trim();
				if (token) {
					token = tokenRSAService.rsaDecrypt(token);
					// 验证一下字符串是否符合约定好的规则
					// rsa(token+gatherup+timestamp+udid)
					let arr = token.split('+');
					if (_.toInteger(arr.length) === 4) {
						req.params['udid'] = arr[3].trim();
					}

					// 检查udid的长度
					if (_.toString(req.params.udid).length != 32) {
						LOGGER.warn("udid length incorrect, udid: %s, version: %s", req.params.udid, req.params.version);
						return ErrorCode.systemError.parameterError;
					}
				}

				// 获取ip
				req.params['ip'] = _.toString(req.header("X-Forwarded-For")) || _.toString(req.header("X-Real-IP"));
				var jsonParam = JSON.stringify(req.params);
				if (properties['system.env'] === 'dev') {
					LOGGER.info('url: %s, param(%s): %s', k_url, filesystem.getSize(jsonParam.length), jsonParam);
				}

				// 判断是网页还是手机来的访问
				let userAgent = _.toString(req.headers['user-agent']);
				req.params['from'] = (_.toInteger(userAgent.indexOf('iGatherUp')) <= -1 && _.toInteger(userAgent.indexOf('Java')) <= -1) ? 'web' : 'mobile';

				// 执行处理方法
				var t = timeUtil.nanoTime();
				let data = await v_map.func(req, res, req.params);
				t = timeUtil.showTime(timeUtil.nanoTime() - t);

				// 组装返回数据
				json['time'] = timeUtil.now();
				let isNumber = _.isNumber(data);
				if (isNumber || data) {
					let errorCode = _.toInteger(data.errorCode);
					if (errorCode > 0) {
						json['status'] = errorCode;
						json['errorMsg'] = data.errorMessage.toString();
					} else {
						json['status'] = 0;
						json['data'] = data;
					}
				} else {
					LOGGER.info('method: %s, url: %s, exec: %s', req.method, k_url, t);
					return;
				}
			} catch (e) {
				LOGGER.error(e);
				json['status'] = parseInt(ErrorCode.systemError.unknowError.errorCode);
				json['errorMsg'] = ErrorCode.systemError.unknowError.errorMessage.toString();
				res.json(json);
				if (filesystem.isLinux()) {
					let isDEV = properties['system.env'] === 'dev';
					mailUtil.send("nodejs" + (isDEV ? '-test' : '') + " 服务器发生错误", '<pre>' + e.stack + '</pre>', "ruanzhijun@gatherup.cc");
				}
				return;
			}
			var jsonReturn = JSON.stringify(json);
			if (properties['system.env'] === 'product') {
				LOGGER.warn('method: %s, url: %s, exec: %s', req.method, k_url, t);
			} else {
				LOGGER.info('method: %s, url: %s, exec: %s, send data(%s): %s', req.method, k_url, t, filesystem.getSize(jsonReturn.length), jsonReturn);
			}
			res.json(json);
		};
		switch (v_map.method) {
			case 'get':
				app.get(k_url, func);
				break;
			case 'post':
				app.post(k_url, func);
				break;
			case 'all':
				app.use(k_url, func);
				break;
		}
	});

	// 启动http服务器，监听端口
	app.listen(port);

	// 屏蔽一些服务器参数
	app.disable('x-powered-by');
	app.disable('etag');
	LOGGER.warn('http server %s start success, bind port %s ...', properties["project.name"], port);
};