// 短信模板
function SmsTemplate(templateId) {
	this.templateId = templateId;
}
module.exports = {
	/**
	 * 短信验证码(15321)<br>
	 * 【共做室APP】验证码{1}，{2}分钟输入有效，脑洞大开，创意头脑风暴嗨起来哟！
	 */
	SmsVerifyCode: new SmsTemplate("15321"),
	/**
	 * 企业发布专案通知后台审核(16152)<br>
	 * 【共做室】{1}公司已经发布了专案{2}，请尽快审核！
	 */
	ApproveCase: new SmsTemplate("16152"),
	/**
	 * 服务器发生错误(16149)<br>
	 * 【共做室】服务器发生错误，{1}
	 */
	ServerError: new SmsTemplate("16149"),
	/**
	 * 品牌注册成功提示(16150)<br>
	 * 【共做室】品牌“{1}”注册成功！
	 */
	CompanyRegisterSuccess: new SmsTemplate("16150"),
	/**
	 * 重置密码短信提示(16151)<br>
	 * 【共做室】您正在重置密码，验证码是{1}，{2}分钟输入有效！
	 */
	ResetPassword: new SmsTemplate("16151"),
	/**
	 * 设置支付密码短信提示(18693)<br>
	 * 【共做室】您正在设置支付密码，验证码是({1})，{2}分钟输入有效！
	 */
	SetPaymentPassword: new SmsTemplate("18693"),
	/**
	 * 企业充值成功(19366)<br>
	 * 【共做室】你已成功充值 {1} 元，获得共做室平台的{2}，请登录共做室官网查看具体详情，发布专案征集创意！
	 */
	ChargeSuccess: new SmsTemplate("19366"),
	/**
	 * 推荐点子提醒(19433)<br>
	 * 【共做室】{1} 品牌发布的专案 {2} 还有 {3} 小时结束，请尽快登录后台推荐点子！
	 */
	IdeaIntroduce: new SmsTemplate("19433"),
	/**
	 * 品牌管理验证(19435)<br>
	 * 【共做室】您正在设置品牌管理员手机，验证码是：{1}，{2} 分钟内输入有效！
	 */
	CompanyVerifyCode: new SmsTemplate("19435"),
	/**
	 * 余额不足提醒(19489)<br>
	 * 【共做室】微信商户号余额只有 {1} 元，请尽快充值！
	 */
	MchiBalanceNotEnough: new SmsTemplate("19489"),
	/**
	 * 企业充值提醒(19706)<br>
	 * 【共做室】{1} 公司充值了 {2} 元，合计 {3} G币。
	 */
	CompanyChargeTips: new SmsTemplate("19706"),
	/**
	 * 企业充值成功2(21844)<br>
	 * 【共做室】您已成功充值{1}，在{2}前，尊享{3}次发布项目机会。请在有效期内登录共做室官网(gatherup.cc)发布项目征集创意。
	 */
	ChargeSuccess2: new SmsTemplate("21844"),
	/**
	 * 充值成功提醒(21847)<br>
	 * 【共做室】{1} 公司充值 {2} 元，套餐： {3}，到期时间：{4}，剩下专案次数：{5}。
	 */
	CompanyChargeTips2: new SmsTemplate("21847"),
	/**
	 * 企业充值失败(21849)<br>
	 * 【共做室】你充值的套餐已下架，充值不成功！管理员确认后，充值的金额将原路返回。如有疑问，请联系管理员，电话：{1}。
	 */
	ChargeFail: new SmsTemplate("21849"),
	/**
	 * 充值失败提醒(21848)<br>
	 * 【共做室】{1} 公司充值的套餐不存在，套餐ID：{2}，充值金额：{3}。请尽快确认，并把金额原路返回。
	 */
	CompanyChargeTips3: new SmsTemplate("21848"),
	/**
	 * 获奖点子推介(23851)<br>
	 * 【共做室】项目{1}还有{2}小时结束，请速速到后台推介获奖点子！
	 */
	AwardIdeasPromotion: new SmsTemplate("23851"),
	/**
	 * 通知品牌选idea1(24534)<br>
	 * 【共做室】您好，您在共做室的{1}项目已顺利进入聚敛阶段咯！请{2}挑选您喜欢的创意，让创意人为您继续细化方案。Let's BrainStorming！
	 */
	NotificationCompanySelectIdea1: new SmsTemplate("24534"),
	/**
	 * 通知品牌选idea2(25569)<br>
	 * 【共做室】尊敬的品牌客户，请您{1}挑选您喜欢的创意，才能结束项目的征集，收取您的项目方案！
	 */
	NotificationCompanySelectIdea2: new SmsTemplate("25569"),
	/**
	 * 执行方申请通知(25262)<br>
	 * 【共做室】“{1}”已经发送了执行方申请请求，请尽快处理！
	 */
	ExecutiveApply: new SmsTemplate("25262"),
	/**
	 * 执行企业过审(26098)<br>
	 * 【共做室】恭喜！你已经成功申请为共做室“营销服务方”，快去上传你的作品和服务套餐，才能用技能接单赚钱哦！
	 */
	ExecutiveCompanyPass: new SmsTemplate("26098"),
	/**
	 * 执行个人过审(26534)<br>
	 * 【共做室】恭喜！您已经通过接私活申请！成为专业创意执行人！
	 */
	ExecutiveUserPass: new SmsTemplate("26534"),
	/**
	 * 执行审核失败(26859)<br>
	 * 【共做室】很遗憾，我们暂时无法通过您的接私活申请！理由是：{1}！请重新编辑申请资料。
	 */
	ExecutiveFaile: new SmsTemplate("26859"),
	/**
	 * 执行资格撤销(26860)<br>
	 * 【共做室】很遗憾！你的接私活资格被撤销！理由是：{1}！请重新编辑申请资料。
	 */
	ExecutiveRevoke: new SmsTemplate("26860"),
	/**
	 * CPC项目发布(29247)<br>
	 * 【共做室】“{1}”品牌的CPC项目《{2}》已经发布！
	 */
	cpcProjectPost: new SmsTemplate("29247"),
	/**
	 * 社会营销申请(29761)<br>
	 * 【共做室】“{1}”品牌申请发布社会化营销项目！
	 */
	smmProjectPost: new SmsTemplate("29761"),
	/**
	 * KOL发送申请(30346)<br>
	 * 【共做室】用户“{1}”已发送KOL申请，请尽快审核！
	 */
	kolApply: new SmsTemplate("30346"),
	/**
	 * KOL通过审核(30352)<br>
	 * 【共做室】恭喜！您已经通过审核成为KOL！快去参与KOL招募活动吧！
	 */
	kolApplyPass: new SmsTemplate("30352"),
	/**
	 * KOL审核失败(30354)<br>
	 * 【共做室】很遗憾！您的KOL申请未能通过审核！理由是：{1}。请重新完善资料吧！
	 */
	kolApplyFaile: new SmsTemplate("30354"),
	/**
	 * KOL资格撤销(30355)<br>
	 * 【共做室】很遗憾！您的KOL资格被撤销！理由是：{1}。请重新完善资料吧！
	 */
	kolApplyRevoke: new SmsTemplate("30355")
};


let templateMap = new Map();
_.forEach(module.exports, function (v, k) {
	templateMap.set(_.toInteger(v.templateId), _.toString(k));
});

/**
 * 根据传入的值返回template名称
 * @param template template对象
 */
module.exports.valueOf = function (template) {
	return templateMap.get(_.toInteger(template.templateId));
};