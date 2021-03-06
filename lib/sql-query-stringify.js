const { isObject, escapeString } = require('./helper');

const SPLIT_COLUMN_REGEX = /(?:\s{1,})?,(?:\s{1,})?/g;
// includes parentheses in first column name
const ASSIGN_REGEX = /(.+?)(?:\s{1,})(as)(?:\s{1,})(\w{1,})/gi;
const NON_ASSIGN_REGEX = /^(.+?)\s{1,}(\w{1,})$/g;

const BACKTICK_REGEX = /`/g;
const QUAL_REGEX = /\./g;
const ALL_REGEX = /^\s*?\(?\s*?(\w+\.)?(\*)\s*?\)?\s*?/g;
const PARENTHESES_REGEX = /^\((.+?)\)$/g;
const FUNCTION_REGEX = /^(\w+)\((.+?)?\)$/gm;
const OPERATORS_REGEX = /((?:'|")?\w{1,}(?:\((?:.+?)?\))?(?:"|')?)(?:\s{1,}?)(\+|-|\*|\/)(?:\s{1,}?)((?:'|")?\w{1,}(?:\((?:.+?)?\))?(?:'|")?)/g;
const STRING_VALUE_REGEX = /('|")(\w{1,})('|")/g;
const LIKE_WILDCARD_REGEX = /%|_|\[\S+\-\S+\]|\[(?:\S+)?\^(?:\S+)?\]/g;

function escapeKey(val, forbidQualified, ignoreNumber = false, ignoreString = false) {
  if (Array.isArray(val)) {
    let sql = '';

    for (let i = 0; i < val.length; i++) {
      sql += (i === 0 ? '' : ', ') + escapeKey(val[i], forbidQualified, ignoreNumber, ignoreString);
    }

    return sql;
  }

  if (typeof val === 'boolean' || val === 'true' || val === 'false') {
    return Boolean(val);
  }

  if (ignoreNumber && !Number.isNaN(+val)) { // not parse number
    return +val;
  }

  let columnName = String(val);

  // reset them because test and exec will change index
  ALL_REGEX.lastIndex = 0;
  FUNCTION_REGEX.lastIndex = 0;
  PARENTHESES_REGEX.lastIndex = 0;
  OPERATORS_REGEX.lastIndex = 0;
  STRING_VALUE_REGEX.lastIndex = 0;

  if (ALL_REGEX.test(columnName)) {
    ALL_REGEX.lastIndex = 0;

    const dotColumn = ALL_REGEX.exec(columnName)[1];
    if (typeof dotColumn !== 'undefined') {
      return '`' + dotColumn.replace(BACKTICK_REGEX, '``').replace(QUAL_REGEX, '`.*');
    }

    return columnName.trim();
  }

  const hasOperator = OPERATORS_REGEX.test(columnName);
  const hasParentheses = PARENTHESES_REGEX.test(columnName);
  const hasFunction = FUNCTION_REGEX.test(columnName);

  // reset them because test and exec will change index
  FUNCTION_REGEX.lastIndex = 0;
  PARENTHESES_REGEX.lastIndex = 0;
  OPERATORS_REGEX.lastIndex = 0;

  if (hasOperator) {
    let [, col1, op, col2] = OPERATORS_REGEX.exec(columnName) || [];
    col1 = escapeKey(col1, forbidQualified, true, STRING_VALUE_REGEX.test(columnName));
    col2 = escapeKey(col2, forbidQualified, true, STRING_VALUE_REGEX.test(columnName));

    if (hasParentheses) {
      return `(${col1} ${op} ${col2})`;
    }

    return `${col1} ${op} ${col2}`;
  }

  if (!ignoreString) {
    columnName = escapeString(columnName);
  }

  if (hasFunction) {
    return columnName.trim();
  }

  if (hasParentheses) {
    columnName = PARENTHESES_REGEX.exec(columnName)[1];
  }

  if (!ignoreString) {
    if (forbidQualified) {
      columnName = '`' + columnName.replace(BACKTICK_REGEX, '``') + '`';
    } else {
      columnName = '`' + columnName.replace(BACKTICK_REGEX, '``').replace(QUAL_REGEX, '`.`') + '`';
    }
  }

  if (hasParentheses) {
    return '(' + columnName + ')';
  }

  return columnName;
}

function escapeValue(val, allowNull = true) {
  if (typeof val === 'boolean' || val === 'true' || val === 'false') {
    return Boolean(val);
  }

  if (val === null && allowNull) {
    return 'NULL';
  }

  if (!Number.isNaN(+val)) { // not parse number
    return +val;
  }

  const value = String(val);
  FUNCTION_REGEX.lastIndex = 0;
  const hasFunction = FUNCTION_REGEX.test(value);

  if (hasFunction) {
    return value.trim();
  }

  return `'${escapeString(value)}'`;
}

/**
 *
 * @param {String} col1
 * @param {String} col2
 * @param {String} asOp - as operator
 */
function as(col1, col2, asOp = 'AS') {
  ALL_REGEX.lastIndex = 0;

  if (ALL_REGEX.test(col1) || ALL_REGEX.test(col2)) {
    throw new Error('You have an error in your SQL syntax.');
  }

  const nameCol = escapeKey(col1, false, true);
  const asNameCol = escapeKey(col2);

  return [nameCol, asOp, asNameCol].join(' ');
}

function escapeColumn(column) {
  ASSIGN_REGEX.lastIndex = 0;
  NON_ASSIGN_REGEX.lastIndex = 0;
  FUNCTION_REGEX.lastIndex = 0;

  const hasAssign = ASSIGN_REGEX.test(column);
  const hasNonAssign = NON_ASSIGN_REGEX.test(column);
  const hasFunction = FUNCTION_REGEX.test(column);

  // escapse string
  if (hasAssign) {
    const [, nameCol, asOp, asNameCol] = column.split(ASSIGN_REGEX);

    return as(nameCol, asNameCol, asOp);
  }

  if (hasNonAssign) {
    const [, nameCol, asNameCol] = column.split(NON_ASSIGN_REGEX);

    return as(nameCol, asNameCol);
  }

  if (hasFunction) {
    return column;
  }

  return escapeKey(column, false, true);
}

function columns(columnData, assign) {
  SPLIT_COLUMN_REGEX.lastIndex = 0;

  if (Array.isArray(columnData)) {
    if (isObject(columnData[0])) {
      return columns(columnData[0], assign);
    }

    return columnData.map((c) => columns(c, assign)).join(', ');
  }

  if (typeof columnData === 'string') {
    return columnData.split(SPLIT_COLUMN_REGEX).map((c) => {
      if (typeof assign === 'string' && assign.trim() !== '') {
        return escapeColumn(assign + '.' + c);
      }

      return escapeColumn(c);
    }).join(', ');
  }

  if (isObject(columnData)) {
    const objectColumns = Object.keys(columnData).filter(column => (typeof columnData[column] !== 'undefined'));
    return objectColumns.map((c) => {
      if (typeof assign === 'string' && assign.trim() !== '') {
        return escapeColumn(assign + '.' + c);
      }

      return escapeColumn(c);
    }).join(', ');
  }

  return columnData;
}

function stringifyClause(key, value) {
  const strEscapeKey = escapeKey(key, false, true);
  const strEscapeValue = escapeValue(value);

  return strEscapeKey + ' = ' + strEscapeValue;
}

function stringifyWhereClause(key, value, operator = '=') {
  const strEscapeKey = escapeKey(key, false, true);
  const strEscapeValue = escapeValue(value);

  if (value === null) {
    operator = 'IS';
  }

  LIKE_WILDCARD_REGEX.lastIndex = 0;
  if (value && LIKE_WILDCARD_REGEX.test(value)) {
    operator = 'LIKE';
  }

  return strEscapeKey + ' ' + operator + ' ' + strEscapeValue;
}

function stringifyArrayWhereToClause(key, arr) {
  const whereClauses = [];

  for (let i = 0; i < arr.length; i++) {
    whereClauses.push(stringifyWhereClause(key, arr[i]));
  }

  return whereClauses;
}

function whereBuilder(columnName, clausesObj, clause = 'AND') {
  if (Array.isArray(clausesObj)) {
    const valuesString = clausesObj.filter((c) => !isObject(c)).map(escapeValue).join(', ');

    return `${escapeKey(columnName)} IN (${valuesString})`;
  }

  if (isObject(clausesObj)) {
    const whereClauses = [];

    Object.keys(clausesObj).forEach((key) => {
      const clauseObj = clausesObj[key];
      let results = null;

      if (typeof columnName === 'string' && columnName !== '' && key.toLowerCase().trim() !== '$or' && key.toLowerCase().trim() !== '$and') {
        results = whereBuilder(`${columnName}.${key}`, clauseObj, (key === '$or' ? 'OR' : 'AND'));
      } else {
        results = whereBuilder(columnName || key, clauseObj, (key === '$or' ? 'OR' : 'AND'));
      }

      if ((key.toLowerCase() === '$or' || key.toLowerCase() === '$and') && !Array.isArray(clauseObj)) {
        results = '(' + results + ')';
      }

      whereClauses.push(results);
    });

    return whereClauses.join(` ${clause} `);
  }

  return stringifyWhereClause(columnName, clausesObj);
}

function where(obj) {
  if (isObject(obj)) {
    const sqlWhereClauses = Object.keys(obj).map((key) => {
      const clauseObj = obj[key];

      if (key.toLowerCase() === '$or') {
        return '(' + whereBuilder(null, clauseObj, 'OR') + ')';
      }

      if (key.toLowerCase() === '$and') {
        return '(' + whereBuilder(null, clauseObj) + ')';
      }

      return whereBuilder(key, clauseObj);
    });

    return sqlWhereClauses.join(' AND ');
  }

  return null;
}

function set(setValues, ignoreUndefined = true) {
  if (isObject(setValues)) {
    const setStatements = [];

    Object.keys(setValues).forEach((key) => {
      const value = setValues[key];

      if (ignoreUndefined && typeof value === 'undefined') {
        return;
      }

      setStatements.push(stringifyClause(key, value));
    });

    return setStatements.join(', ');
  }

  return String(setValues);
}

function values(setValues, ignoreUndefined = true) {
  if (Array.isArray(setValues)) {
    const valuesStatement = [];

    for (let i = 0; i < setValues.length; i++) {
      const element = setValues[i];

      if (ignoreUndefined && typeof element === 'undefined') {
        continue;
      }

      valuesStatement.push(values(element, ignoreUndefined));
    }

    return valuesStatement.join(', ');
  }

  if (isObject(setValues)) {
    const values = [];
    const listKeys = Object.keys(setValues);

    for (let i = 0; i < listKeys.length; i++) {
      const element = setValues[listKeys[i]];

      if (ignoreUndefined && typeof element === 'undefined') {
        continue;
      }

      values.push(escapeValue(element));
    }

    return `(${values.join(', ')})`;
  }

  if (typeof setValues === 'string') {
    return escapeValue(setValues);
  }

  return null;
}

function select({ columns: columnsName = '*', from, where: whereObj, orderBy, order = 'DESC', limit, skip }) {
  if (typeof from !== 'string') {
    throw new Error('Missing select `from` table.');
  }

  let whereClause = whereObj;
  let columnSql;

  if (typeof columnsName === 'function') {
    columnSql = columnsName(columns);
  } else {
    columnSql = columns(columnsName);
  }

  const sqlSelect = [`SELECT ${columnSql} FROM ${escapeKey(from)}`];

  if (typeof whereObj !== 'string') {
    whereClause = where(whereObj);
  }

  if (whereClause && whereClause !== '') {
    sqlSelect.push('WHERE');
    sqlSelect.push(whereClause);
  }

  if (orderBy) {
    sqlSelect.push(`ORDER BY ${escapeKey(orderBy)} ${order}`);
  }

  if (limit >= 0 && skip >= 0) {
    sqlSelect.push(`LIMIT ${skip}, ${limit}`);
  } else if (limit >= 0) {
    sqlSelect.push(`LIMIT ${limit}`);
  }

  return sqlSelect.join(' ');
}

function remove(from, whereObj) {
  const sql = [`DELETE FROM ${escapeKey(from)}`];

  const whereStr = where(whereObj);

  if (whereStr) {
    sql.push('WHERE');
    sql.push(whereStr);
  }

  return sql.join(' ');
}

function update(from, values, whereObj) {
  const sql = [`UPDATE ${escapeKey(from)}`];

  const valuesStatement = set(values);
  if (valuesStatement) {
    sql.push('SET');
    sql.push(valuesStatement);
  }

  const whereStatement = where(whereObj);
  if (whereStatement) {
    sql.push('WHERE');
    sql.push(whereStatement);
  }

  return sql.join(' ');
}

function insert(into, setValues, ignoreUndefined = true) {
  const sql = [`INSERT INTO ${escapeKey(into)}`];

  const valuesStatement = set(setValues, ignoreUndefined);
  if (valuesStatement) {
    sql.push('SET');
    sql.push(valuesStatement);
  }

  return sql.join(' ');
}

function insertMany(into, listValue, ignoreUndefined = true) {
  const sql = [`INSERT INTO ${escapeKey(into)}`];

  const columnStatement = columns(listValue);
  sql.push(`(${columnStatement})`);

  const valuesStatement = values(listValue, ignoreUndefined);
  sql.push('VALUES');
  sql.push(valuesStatement);

  return sql.join(' ');
}

function count(from, where, columns = '*', as = 'count') {
  return select({ where, from, columns: `COUNT(${columns}) AS ${as}` });
}

function noQuoteSql(sqlQueryString) {
  return {
    toSqlString() {
      return sqlQueryString;
    },
    toString() {
      return sqlQueryString;
    },
  };
}

module.exports = {
  noQuoteSql,
  columns,
  escapeKey,
  escapeValue,
  set,
  where,
  values,
  select,
  remove,
  update,
  insert,
  insertMany,
  count,
};
