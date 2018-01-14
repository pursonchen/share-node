/**
 * 字符串工具
 */
module.exports = {
  /**
   * 生成指定长度的随机字符串
   * @param n 长度
   */
  randomString(n) {
    function random() {
      return Math.random().toString(36).substr(2).replace(new RegExp(/[0-9]+/g), '');
    }

    let str = random();
    while (str.length < n) {
      str += random();
    }
    str = str.substring(0, n);

    return str;
  },
  /**
   * 转为下划线风格
   * @param str 字符串
   */
  snakeCase(str) {
    return str.replace(/([^A-Z])([A-Z])/g, ($0, $1, $2) => `${$1}_${$2.toLowerCase()}`);
  },
  /**
   * 转为驼峰风格
   * @param str 字符串
   */
  camelCase(str) {
    if (str.indexOf('_') > -1) {
      return str.replace(/_(\w)/g, (a, b) => b.toUpperCase());
    }
    return str;
  },
  /**
   * 首字母小写
   * @param str 字符串
   */
  firstLowerCase(str) {
    return str ? str.substring(0, 1).toLowerCase() + str.substring(1) : '';
  },
  /**
   * 首字母大写
   * @param str 字符串
   */
  firstUpperCase(str) {
    return str ? str.substring(0, 1).toUpperCase() + str.substring(1) : '';
  },
  /**
   * 判断是否为json字符串
   * @param str 字符串或者对象
   */
  isJSON(str) {
    const typeSet = new Set(['object', '[object object]', '[object array]']);
    const type = Object.prototype.toString.call(str).toLowerCase();
    if (typeSet.has(type)) {
      return true;
    }

    if (/^[0-9]+$/g.test(str)) {
      return false;
    }

    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  },
};