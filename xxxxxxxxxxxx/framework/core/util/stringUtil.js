/**
 * 字符串工具
 */
const LOGGER = logUtil.getLogger(module.filename);
const WORDS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

import xml2js from "xml2js";
module.exports = {
	/**
	 * 截取定长开头字段,剩下的用省略号表示(str.length()<=length不处理)
	 * @param str 字符串
	 * @param length 截取的长度
	 */
	cutLengthEllipses: function (str, length) {
		let strLength = str.length;
		if (strLength <= length) {
			return str;
		}
		return str.substring(0, length) + "...";
	},
	/**
	 * 把xml字符串转成map
	 * @param xml xml字符串
	 */
	xml2json: async function (xml) {
		if (_.isEmpty(xml)) {
			return {};
		}
		return new Promise(function (resolve, reject) {
			xml2js.parseString(xml, function (err, result) {
				if (err) {
					reject(err);
				} else {
					let json = {};
					_.forEach(result.xml, function (value, key) {
						json[key] = value.toString();
					});
					resolve(json);
				}
			});
		}).catch(function (error) {
			LOGGER.error(error);
		});
	},
	/**
	 * 把map转成xml字符串
	 * @param json
	 */
	json2xml: function (json) {
		let xml = '<xml>';
		if (!_.isEmpty(xml)) {
			_.forEach(json, function (value, key) {
				xml += '<';
				xml += key;
				xml += '>';
				xml += value;
				xml += '</';
				xml += key;
				xml += '>';
			});
		}
		xml += '</xml>';
		return xml;
	},
	/**
	 * 生成指定长度的随机字符串
	 * @param length 长度
	 */
	random: function (length) {
		let str = "";
		while (str.length < length) {
			str += WORDS[_.random(0, WORDS.length - 1)];
		}
		return str;
	},
	/**
	 * 首字母大写
	 * @param str 字符串
	 */
	firstUpperCase: function (str) {
		str = _.toString(str).trim();
		return str.substring(0, 1).toUpperCase() + str.substring(1);
	}
};