// mysql类
import logger from "../util/logUtil";
import mysql from "mysql";
let LOGGER = logger.getLogger(module.filename);

/**
 * 程序字段->数据库字段(adminPhoneId->admin_phone_id)
 * @param fieldName
 */
function fieldNameToColumnName(fieldName) {
	var columnName = "";
	var l = fieldName.length;
	for (let i = 0; i < l; i++) {
		let c = fieldName.charAt(i);
		if (i > 0 && c.charCodeAt(0) >= 65 && c.charCodeAt(0) <= 90) {
			columnName = columnName + "_";
			columnName = columnName + c;
		} else {
			columnName = columnName + c;
		}
	}
	return columnName.toLowerCase();
}

/**
 * pojo类型->成表名(DAdminPhoneId->admin_phone_id)
 * @param className
 */
function classNameToTableName(className) {
	var tableName = "";
	var l = className.length;
	for (let i = 1; i < l; i++) {
		let c = className.charAt(i);
		if (i > 2 && c.charCodeAt(0) >= 65 && c.charCodeAt(0) <= 90) {
			tableName = tableName + "_";
			tableName = tableName + c;
		} else {
			tableName = tableName + c;
		}
	}
	return tableName.toLowerCase();
}

/**
 * 程序字段->数据库字段(admin_phone_id->adminPhoneId)
 * @param columnName
 */
function columnNameToFieldName(columnName) {
	var fieldName = "";
	var l = columnName.length;
	var _char = false;
	for (let i = 0; i < l; i++) {
		let c = columnName.charAt(i);
		if (c == "_") {
			_char = true;
		} else {
			if (_char) {
				fieldName = fieldName + c.toUpperCase();
				_char = false;
			} else {
				fieldName = fieldName + c;
			}
		}
	}
	return fieldName;
}

module.exports = function (config) {
	let pool = mysql.createPool(config);
	LOGGER.warn('connect to mysql %s:%s, database \'%s\' success!', pool.config.connectionConfig.host, pool.config.connectionConfig.port, pool.config.connectionConfig.database);
	return {
		/**
		 * 查询数据
		 * @param sql sql语句
		 * @param args 参数数组
		 */
		query: function (sql, ...args) {
			return new Promise(function (resolve, reject) {
				if (_.isFunction(args[0])) {
					throw new Error("query() method parameter error, please use queryT(), getClass() : " + new args[0]().getClass());
				}
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, args, function (err, data) {
						if (err) {
							reject(err);
						} else {
							resolve(data);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 更新数据
		 * @param sql
		 * @param args
		 * @returns {Promise.<Boolean>} 布尔值
		 */
		update: function (sql, ...args) {
			return new Promise(function (resolve, reject) {
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, args, function (err, data) {
						if (err) {
							reject(err);
						} else {
							resolve(data.affectedRows > 0);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 保存数据
		 * @param t 对象实体
		 * @returns {Promise.<t>} 对象实体
		 */
		save: function (t) {
			try {
				// 主键是否是id
				var idIsPrimary = false;
				var args = [];
				var clazz = t.getClass();
				var sql = 'replace into `' + classNameToTableName(clazz) + '` (';
				var value_wenhao = "";
				_.forEach(t, function (value, k_field) {
					if (_.isFunction(t[k_field])) {
						return;
					}
					if (k_field == "id" && !value) {
						idIsPrimary = true;
						return;
					}
					sql = sql + '`' + fieldNameToColumnName(k_field) + '`,';
					value_wenhao = value_wenhao + "?,";
					// 数组类型自动转成JSONString
					if (_.isObjectLike(value)) {
						args.push(JSON.stringify(value));
						return;
					}
					args.push(value);
				});
				sql = sql.substr(0, sql.length - 1) + ') values (';
				sql = sql + value_wenhao.substr(0, value_wenhao.length - 1) + ")";
			} catch (e) {
				LOGGER.error(e);
			}
			return new Promise(function (resolve, reject) {
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, args, function (err, data) {
						if (err) {
							reject(err);
						} else {
							// 主键是id
							if (idIsPrimary) {
								if (data.insertId > 0) {
									t.id = data.insertId;
								}
								resolve(t);
							}
							resolve(t);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 更新数据
		 * @param t 对象实体
		 * @returns {Promise.<Boolean>} 布尔值
		 */
		updateT: function (t) {
			try {
				var args = [];
				var clazz = t.getClass();
				var table = classNameToTableName(clazz);
				var columnMap = NumKey.tableColumnMap[table];
				var sql = "update `" + table + "` set ";
				_.forEach(t, function (value, k_field) {
					if (_.isFunction(t[k_field])) {
						return;
					}
					if (k_field === "id") {
						return;
					}
					var column = fieldNameToColumnName(k_field);
					//忽略的统计字段
					if (!_.isUndefined(columnMap) && !_.isUndefined(columnMap[column])) {
						return;
					}
					sql = sql + '`' + column + '`=?,';
					// 数组类型自动转成JSONString
					if (_.isObjectLike(value)) {
						args.push(JSON.stringify(value));
						return;
					}
					args.push(value);
				});
				sql = sql.substr(0, sql.length - 1) + " where `" + fieldNameToColumnName(Key[clazz].sqlKey) + "`=?";
				args.push(t[Key[clazz].sqlKey]);
			} catch (e) {
				LOGGER.error(e);
			}
			return new Promise(function (resolve, reject) {
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, args, function (err, data) {
						if (err) {
							reject(err);
						} else {
							resolve(data.affectedRows > 0);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 查询数据对象
		 * @param sql sql语句
		 * @param T 对象方法
		 * @param args 参数数组
		 * @returns {Promise.<t>} 对象实体
		 */
		queryT: function (sql, T, ...args) {
			return new Promise(function (resolve, reject) {
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, args, function (err, data) {
						if (err) {
							reject(err);
						} else {
							if (data.length == 0) {
								resolve(null);
							} else {
								var t = new T();
								var clazz = t.getClass();
								var dataT = data[0];
								_.forEach(t, function (value, k_field) {
									if (_.isFunction(t[k_field])) {
										return;
									}
									var column = fieldNameToColumnName(k_field);
									var columnValue = dataT[column];
									if (_.isUndefined(columnValue)) {
										reject(new Error("Invalid column : " + column + ", table : " + clazz));
									}
									if (_.isString(t[k_field])) {
										t[k_field] = columnValue;
										return;
									}
									// 防止超大数字溢出
									if (/^[0-9\.-]+$/.test(columnValue)) {
										if (_.toString(_.toNumber(columnValue)) !== _.toString(columnValue)) {
											t[k_field] = _.toString(columnValue);
											return;
										} else {
											t[k_field] = _.toNumber(columnValue);
											return;
										}
									}
									// 数组类型自动转成JSONString
									if (_.isObjectLike(t[k_field]) && columnValue) {
										t[k_field] = JSON.parse(columnValue);
									}
								});
								resolve(t);
							}
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 查询数据对象列表
		 * @param sql sql语句
		 * @param T 对象方法
		 * @param args 参数数组
		 * @returns {Promise.<Array<t>>} 对象实体数组
		 */
		queryTList: function (sql, T, ...args) {
			return new Promise(function (resolve, reject) {
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, args, function (err, data) {
						if (err) {
							reject(err);
						} else {
							var tList = [];
							data.forEach(function (d) {
								var t = new T();
								var clazz = t.getClass();
								_.forEach(t, function (value, k_field) {
									if (_.isFunction(t[k_field])) {
										return;
									}
									var column = fieldNameToColumnName(k_field);
									var columnValue = d[column];
									if (_.isUndefined(columnValue)) {
										reject(new Error("Invalid column : " + column + ", table : " + clazz));
									}
									if (_.isString(t[k_field])) {
										t[k_field] = columnValue;
										return;
									}
									// 防止超大数字溢出
									if (/^[0-9\.-]+$/.test(columnValue)) {
										if (_.toString(_.toNumber(columnValue)) !== _.toString(columnValue)) {
											t[k_field] = _.toString(columnValue);
											return;
										} else {
											t[k_field] = _.toNumber(columnValue);
											return;
										}
									}
									// 数组类型自动转成JSONString
									if (_.isObjectLike(t[k_field]) && columnValue) {
										t[k_field] = JSON.parse(columnValue);
									}
								});
								tList.push(t);
							});
							resolve(tList);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 批量获取T
		 * @param idSet id集合(Set&lt;Number/String&gt;())
		 * @param T 对象方法
		 * @param sqlKey 数据库主键(程序字段格式)
		 * @returns {Promise.<Array<t>>} 对象实体数组
		 */
		multiGetT: function (idSet, T, sqlKey) {
			// 数据库主键判断
			if (!_.isEqual(sqlKey, "id")) {
				sqlKey = fieldNameToColumnName(sqlKey);
			}
			let t = new T();
			var clazz = t.getClass();
			var table = classNameToTableName(clazz);
			var sql = "select * from `" + table + "` where `" + sqlKey + "` in (" + _.join(Array.from(idSet), ",") + ")";
			return new Promise(function (resolve, reject) {
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, function (err, data) {
						if (err) {
							reject(err);
						} else {
							var TList = [];
							data.forEach(function (d) {
								var t = new T();
								var clazz = t.getClass();
								_.forEach(t, function (value, k_field) {
									if (_.isFunction(t[k_field])) {
										return;
									}
									var column = fieldNameToColumnName(k_field);
									var columnValue = d[column];
									if (_.isUndefined(columnValue)) {
										reject(new Error("Invalid column : " + column + ", table : " + clazz));
									}
									if (_.isString(t[k_field])) {
										t[k_field] = columnValue;
										return;
									}
									// 防止超大数字溢出
									if (/^[0-9\.-]+$/.test(columnValue)) {
										if (_.toString(_.toNumber(columnValue)) !== _.toString(columnValue)) {
											t[k_field] = _.toString(columnValue);
											return;
										} else {
											t[k_field] = _.toNumber(columnValue);
											return;
										}
									}
									// 数组类型自动转成JSONString
									if (_.isObjectLike(t[k_field]) && columnValue) {
										t[k_field] = JSON.parse(columnValue);
									}
								});
								TList.push(t);
							});
							resolve(TList);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 查询数据列表
		 * @param sql sql语句
		 * @param args 参数数组
		 * @return {Promise.<Array<{k:v}>>}
		 */
		queryList: function (sql, ...args) {
			return new Promise(function (resolve, reject) {
				if (_.isFunction(args[0])) {
					throw new Error("queryList() method parameter error, please use queryTList(), getClass() : " + new args[0]().getClass());
				}
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, args, function (err, data) {
						if (err) {
							reject(err);
						} else {
							let list = [];
							data.forEach(function (d) {
								let object = {};
								_.forEach(d, function (value, field) {
									object[columnNameToFieldName(field)] = value;
								});
								list.push(object);
							});
							resolve(list);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		},
		/**
		 * 删除一条数据
		 * @param t pojo对象(pojo对象的名和表名是对应的)
		 */
		deleteT: async function (t) {
			if (_.isUndefined(t.id)) {
				// 没有自增id的不适合用这个函数
				throw new Error("delete() method error, can not find t.id, class: " + new args[0]().getClass());
			}
			// 生成sql delete头
			let clazz = t.getClass();
			let sql = 'delete from `';
			sql += classNameToTableName(clazz);
			sql += "` where id=?";
			return await this.update(sql, t.id);
		},
		/**
		 * 批量获取统计字段的值(不同字段不同id同table)
		 * @param idSet id集合
		 * @param numKeys key枚举
		 * @returns {Promise.<Map<id,Map<{Numkey,Number}>>>}
		 */
		multiGetNumColumn: function (idSet, numKeys) {
			let numkey = numKeys[0];
			var pk = numkey.pk;
			var table = numkey.table;
			var columnSet = new Set();
			numKeys.forEach(function (numKey) {
				columnSet.add(numKey.column);
			});
			var sql = "SELECT `" + pk + "`,`" + _.join([...columnSet], "`,`") + "` FROM `" + table + "` WHERE `id` in (" + _.join([...idSet]) + ")";
			return new Promise(function (resolve, reject) {
				pool.getConnection(function (err, conn) {
					if (err) {
						reject(err);
						return;
					}
					conn.query(sql, function (err, data) {
						if (err) {
							reject(err);
						} else {
							let dataMap = new Map();
							data.forEach(function (d) {
								let map = new Map();
								numKeys.forEach(function (numKey) {
									let column = _.toNumber(d[numKey.column]);
									if (_.isNaN(column) || d[numKey.column] == null) {
										return;
									}
									map.set(numKey, d[numKey.column]);
								});
								if (map.size == 0) {
									return;
								}
								dataMap.set(_.toNumber(d[pk]), map);
							});
							resolve(dataMap);
						}
						conn.release();
					});
				});
			}).catch(function (error) {
				LOGGER.error(error);
			});
		}
	}
};