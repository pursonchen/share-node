module.exports = class extends Error {
  constructor(code, msg) {
    super();
    this.code = code;
    this.message = msg;
  }
};
