const CHARS_GLOBAL_REGEXP = /[\0\b\t\n\r\x1a"'\\]/g; // eslint-disable-line no-control-regex
const CHARS_ESCAPE_MAP = {
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\r': '\\r',
  '\'': '\\\'',
  '\\': '\\\\',
  '"': '\\"',
  '\x1a': '\\Z',
};

exports.escapeString = (val) => {
  CHARS_GLOBAL_REGEXP.lastIndex = 0;
  let chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex;
  let escapedVal = '';
  let match;

  while ((match = CHARS_GLOBAL_REGEXP.exec(val))) {
    escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
    chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex;
  }

  if (chunkIndex === 0) {
    // Nothing was escaped
    return val;
  }

  if (chunkIndex < val.length) {
    return escapedVal + val.slice(chunkIndex);
  }

  return escapedVal;
};

exports.isObject = (testVal) => (
  testVal
  && typeof testVal === 'object'
  && !(testVal instanceof Date)
  && !Array.isArray(testVal)
  && !Buffer.isBuffer(testVal)
);
