import crypto from "crypto";
import cryptos from "cryptos";

module.exports = async function () {
	global.loginRSAService = new RSAService('rsa/login/rsa_public_key.pem', 'rsa/login/pkcs8_rsa_private_key.pem');
	global.accountRSAService = new RSAService('rsa/account/rsa_public_key.pem', 'rsa/account/pkcs8_rsa_private_key.pem');
	global.tokenRSAService = new RSAService('rsa/token/rsa_public_key.pem', 'rsa/token/pkcs8_rsa_private_key.pem');
	global.paymentRSAService = new RSAService('rsa/payment/rsa_public_key.pem', 'rsa/payment/pkcs8_rsa_private_key.pem');
	global.udidRSAService = new RSAService('rsa/udid/rsa_public_key.pem', 'rsa/udid/pkcs8_rsa_private_key.pem');
	global.companyRSAService = new RSAService('rsa/company/rsa_public_key.pem', 'rsa/company/pkcs8_rsa_private_key.pem');
	global.activityRSAService = new RSAService('rsa/activity/rsa_public_key.pem', 'rsa/activity/pkcs8_rsa_private_key.pem');
	global.alipayRSAService = new RSAService('rsa/alipay/rsa_public_key.pem', 'rsa/alipay/pkcs8_rsa_private_key.pem');
	global.wechatRSAService = new RSAService('rsa/wechat/rsa_public_key.pem', 'rsa/wechat/pkcs8_rsa_private_key.pem');
};

function RSAService(publicKey, privateKey) {
	let LOGGER = logUtil.getLogger(publicKey.split('/')[1] + 'RSAService');

	LOGGER.warn("load rsa public key: %s", publicKey);
	this.publicKey = cryptos.pem(filesystem.loadRsaKey(publicKey), {type: 'public_key'});
	LOGGER.warn("load rsa private key: %s", privateKey);
	this.privateKey = cryptos.pem(filesystem.loadRsaKey(privateKey), {type: 'private_key'});

	/**
	 * rsa加密
	 */
	this.rsaEncrypt = function (data) {
		try {
			return cryptos.RSAEncrypt(data, this.publicKey, {});
		} catch (e) {
			LOGGER.error('error encrypt data: ' + data);
			LOGGER.error(e);
			return '';
		}
	};

	/**
	 * rsa解密
	 */
	this.rsaDecrypt = function (data) {
		try {
			return cryptos.RSADecrypt(data, this.privateKey, {});
		} catch (e) {
			LOGGER.error('error decrypt data: ' + data);
			LOGGER.error(e);
			return '';
		}
	};

	/**
	 * rsa-sha1加密
	 */
	this.rsaSha1Encrypt = function (data) {
		try {
			let signer = crypto.createSign('RSA-SHA1').update(data);
			return signer.sign(this.privateKey, 'base64');
		} catch (e) {
			LOGGER.error('error encrypt data: ' + data);
			LOGGER.error(e);
			return '';
		}
	};
}