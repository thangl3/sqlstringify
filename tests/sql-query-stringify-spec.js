const queryString = require('../lib/sql-query-stringify');

describe('Query stringify', function () {
  describe('can escape key', function () {
    it('should is quoted', function () {
      expect(queryString.escapeKey('id')).toEqual('`id`');
    });
    it('can escape a number', function () {
      expect(queryString.escapeKey(42)).toEqual('`42`');
    });
    it('can be a number', function () {
      expect(queryString.escapeKey(42, false, true)).toEqual(42);
    });
    it('can not be a string boolean', function () {
      expect(queryString.escapeKey(true)).toEqual(true);
    });
    it('can be a object', function () {
      expect(queryString.escapeKey({})).toEqual('`[object Object]`');
    });
    it('should toString is called', function () {
      expect(queryString.escapeKey({ toString() { return 'id'; } })).toEqual('`id`');
    });
    it('should toString is quoted', function () {
      expect(queryString.escapeKey({ toString() { return 'i`dentify'; } })).toEqual('`i``dentify`');
    });
    it('should containing escapes is quoted', function () {
      expect(queryString.escapeKey('i`d')).toEqual('`i``d`');
    });
    it('should containing separator is quoted', function () {
      expect(queryString.escapeKey('user.id')).toEqual('`user`.`id`');
    });
    it('should containing separator is fully escaped when forbidQualified', function () {
      expect(queryString.escapeKey('user.id', true)).toEqual('`user.id`');
    });
    it('is turned into lists', function () {
      expect(queryString.escapeKey(['a', 'b', 't.c'])).toEqual('`a`, `b`, `t`.`c`');
    });
    it('should be flattened', function () {
      expect(queryString.escapeKey(['a', ['b', ['t.c']]])).toEqual('`a`, `b`, `t`.`c`');
    });
  });

  describe('stringify where clause object', function () {
    it("should to be <`name` = 'name3' OR `name` = 'name4'>", function () {
      const result = queryString.where({
        name: {
          $or: ['name3', 'name4'],
        },
      });

      expect(result).toEqual("`name` = 'name3' OR `name` = 'name4'");
    });

    it("should to be <`name` = 'name1' OR `name` = 'name2' AND `name` = 'name1' AND `name` = 'name2'>", function () {
      const result = queryString.where({
        name: {
          $or: ['name1', 'name2'],
          $and: ['name1', 'name2'],
        },
      });

      expect(result).toEqual("`name` = 'name1' OR `name` = 'name2' AND `name` = 'name1' AND `name` = 'name2'");
    });

    it("should to be <`name` = 'name1' AND `name` = 'name2' AND `title` = 'title1'>", function () {
      const result = queryString.where({
        name: {
          $and: ['name1', 'name2'],
        },
        title: 'title1',
      });

      expect(result).toEqual("`name` = 'name1' AND `name` = 'name2' AND `title` = 'title1'");
    });

    it("should to be <`name` = 'name1' OR `name` = 'name2' AND `title` = 'title1'>", function () {
      const result = queryString.where({
        name: {
          $or: ['name1', 'name2'],
        },
        title: 'title1',
      });

      expect(result).toEqual("`name` = 'name1' OR `name` = 'name2' AND `title` = 'title1'");
    });

    it("should to be <`name` = 'name1' AND `title` = 'title1'>", function () {
      const result = queryString.where({
        $and: {
          name: 'name1',
          title: 'title1',
        },
      });

      expect(result).toEqual("`name` = 'name1' AND `title` = 'title1'");
    });

    it("should to be <`name` = 'name1' AND `name` = 'name2' OR `title` = 'title1'>", function () {
      const result = queryString.where({
        $or: {
          name: ['name1', 'name2'],
          title: 'title1',
        },
      });

      expect(result).toEqual("`name` = 'name1' AND `name` = 'name2' OR `title` = 'title1'");
    });

    it("should to be <`name` = 'name1' OR `title` = 'title1'>", function () {
      const result = queryString.where({
        $or: {
          name: 'name1',
          title: 'title1',
        },
      });

      expect(result).toEqual("`name` = 'name1' OR `title` = 'title1'");
    });

    it("should to be <`name` = 'name1'>", function () {
      const result = queryString.where({
        name: 'name1',
      });

      expect(result).toEqual("`name` = 'name1'");
    });

    it("should to be <`name` = 'name1'>", function () {
      const result = queryString.where({
        name: ['name1'],
      });

      expect(result).toEqual("`name` = 'name1'");
    });

    it("should to be <`name` = 'name1' AND `title` = 't'>", function () {
      const result = queryString.where({
        name: ['name1'],
        title: ['t'],
      });

      expect(result).toEqual("`name` = 'name1' AND `title` = 't'");
    });

    it("should to be <`name` = 'name1' AND `title` = 'title1' AND `title` = 'title2' AND `isActive` = true>", function () {
      const result = queryString.where({
        name: 'name1',
        title: ['title1', 'title2'],
        isActive: true,
      });

      expect(result).toEqual("`name` = 'name1' AND `title` = 'title1' AND `title` = 'title2' AND `isActive` = true");
    });
  });

  describe('stringify columns', function () {
    it('should be stringify cloumns to <`name`>', function () {
      const result = queryString.columns('name');

      expect(result).toEqual('`name`');
    });

    it('should be stringify cloumns to <`name`, `title`>', function () {
      const result = queryString.columns(['name', 'title']);

      expect(result).toEqual('`name`, `title`');
    });

    it('should be stringify cloumns to <`one`>', function () {
      const result = queryString.columns(['one']);

      expect(result).toEqual('`one`');
    });

    it('should not be stringify cloumns <*>', function () {
      const result = queryString.columns(['*', 'a']);

      expect(result).toEqual('*, `a`');
    });

    it('should not be stringify cloumn <*>', function () {
      const result = queryString.columns('*');

      expect(result).toEqual('*');
    });

    it('should be stringify object to column string', function () {
      const result = queryString.columns({ name: 'name1', title: 'title1', all: '*' });

      expect(result).toEqual('`name1`, `title1`, *');
    });

    it('should be stringify array object to column string', function () {
      const result = queryString.columns([{ name: 'name1', title: 'title1', all: '*' }]);

      expect(result).toEqual('`name`, `title`, `all`');
    });
  });

  describe('select builder', function () {
    it('should convert <empty where> and column <string function>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: 'COUNT(*) AS count',
      });

      expect(sqlString).toEqual('SELECT COUNT(*) AS `count` FROM `test`');
    });

    it('should convert <empty where> and column <array function>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: ['COUNT(*) AS count'],
      });

      expect(sqlString).toEqual('SELECT COUNT(*) AS `count` FROM `test`');
    });

    it('should convert <empty where> and column <array function and column>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: ['COUNT(*) AS count', 'title', 'test AS t'],
      });

      expect(sqlString).toEqual('SELECT COUNT(*) AS `count`, `title`, `test` AS `t` FROM `test`');
    });

    it('should convert <where> and column <array function and column>', function () {
      const sqlString = queryString.select({
        where: { isPublic: true },
        from: 'test',
        columns: ['COUNT(*) AS count', 'title', 'test AS t'],
      });

      expect(sqlString).toEqual('SELECT COUNT(*) AS `count`, `title`, `test` AS `t` FROM `test` WHERE `isPublic` = true');
    });

    it('should convert <where> and column <array operators and parentheses>', function () {
      const sqlString = queryString.select({
        where: { isPublic: true },
        from: 'test',
        columns: ['COUNT(*) - 1 AS count', '(COUNT(*) - 1) AS count'],
      });

      expect(sqlString).toEqual('SELECT COUNT(*) - 1 AS `count`, (COUNT(*) - 1) AS `count` FROM `test` WHERE `isPublic` = true');
    });

    it('should convert <empty where> and column <string operator in parentheses>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: '(COUNT(*) - 1) AS count',
      });

      expect(sqlString).toEqual('SELECT (COUNT(*) - 1) AS `count` FROM `test`');
    });

    it('should convert <empty where> and column <string operator in parentheses>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: '(COUNT(*) - 1) AS count',
      });

      expect(sqlString).toEqual('SELECT (COUNT(*) - 1) AS `count` FROM `test`');
    });

    it('should convert <empty where> and column <string all>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: '*',
      });

      expect(sqlString).toEqual('SELECT * FROM `test`');
    });

    it('should convert <empty where> and column <string all in parentheses>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: '(*)',
      });

      expect(sqlString).toEqual('SELECT (*) FROM `test`');
    });

    it('should convert <empty where> and column <string all in parentheses>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: '(*)',
      });

      expect(sqlString).toEqual('SELECT (*) FROM `test`');
    });

    it('should convert string multiple columns', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: 'name AS abc, title, (desc), (hello) as h, 2 + 2 AS total',
      });

      expect(sqlString).toEqual('SELECT `name` AS `abc`, `title`, (`desc`), (`hello`) as `h`, 2 + 2 AS `total` FROM `test`');
    });

    it('should convert string multiple columns with non-assign', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: [
          'name abc',
          'title',
          '(desc) asd',
          '(hello) h',
          '2 + 2 total',
          "'asd' + 'er' concat",
        ],
      });

      expect(sqlString).toEqual(
        "SELECT `name` AS `abc`, `title`, (`desc`) AS `asd`, (`hello`) AS `h`, 2 + 2 AS `total`, 'asd' + 'er' AS `concat` FROM `test`",
      );
    });

    it('should stringify <order> conditions to sql', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: ['name AS abc', 'title', '(desc)', '(hello) as h', '2 + 2 AS total'],
        orderBy: 'name',
      });

      const expectedSql = 'SELECT `name` AS `abc`, `title`, (`desc`), (`hello`) as `h`, 2 + 2 AS `total` FROM `test` ORDER BY `name` DESC';
      expect(sqlString).toEqual(expectedSql);
    });

    it('should stringify <limit, skip> conditions to sql', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: ['name AS abc'],
        limit: 20,
        skip: 10,
      });

      const expectedSql = 'SELECT `name` AS `abc` FROM `test` LIMIT 10, 20';
      expect(sqlString).toEqual(expectedSql);
    });

    it('should stringify <limit, skip and order> conditions to sql', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: ['name AS abc'],
        limit: 20,
        skip: 10,
        orderBy: 'name',
        order: 'ASC',
      });

      const expectedSql = 'SELECT `name` AS `abc` FROM `test` ORDER BY `name` ASC LIMIT 10, 20';
      expect(sqlString).toEqual(expectedSql);
    });

    it('should not stringify <array column boolean>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: ['true AS 1'],
      });

      const expectedSql = 'SELECT true AS `1` FROM `test`';
      expect(sqlString).toEqual(expectedSql);
    });

    it('should not stringify <column boolean>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: true,
      });

      const expectedSql = 'SELECT true FROM `test`';
      expect(sqlString).toEqual(expectedSql);
    });

    it('should convertor throw error', function () {
      expect(() => {
        queryString.select({
          where: {},
          from: 'test',
          columns: '(*) AS all',
        });
      }).toThrowError('You have an error in your SQL syntax.');
    });

    it('should convertor not throw error', function () {
      expect(() => {
        queryString.select({
          where: {},
          from: 'test',
          columns: 'name as 1',
        });
      }).not.toThrowError('You have an error in your SQL syntax.');
    });

    it('should stringify <number as>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: '1 AS all',
      });

      expect(sqlString).toEqual('SELECT 1 AS `all` FROM `test`');
    });

    it('should not stringify <number as>', function () {
      const sqlString = queryString.select({
        where: {},
        from: 'test',
        columns: 'all AS 1',
      });

      expect(sqlString).toEqual('SELECT `all` AS `1` FROM `test`');

      const sqlString2 = queryString.select({
        where: {},
        from: 'test',
        columns: 'true AS 1',
      });

      expect(sqlString2).toEqual('SELECT true AS `1` FROM `test`');
    });

    it('should throw error', function () {
      expect(() => {
        queryString.select({
          where: {},
          columns: '1 AS all',
        });
      }).toThrowError('Missing select `from` table.');
    });
  });

  describe('set builder', function () {
    it('should be converted to empty string', function () {
      const result = queryString.set({});
      const result1 = queryString.set();
      const result2 = queryString.set([]);

      expect(result).toEqual('');
      expect(result1).toEqual('undefined');
      expect(result2).toEqual('');
    });

    it('should be converted to string', function () {
      const result = queryString.set({ name: 'abc' });

      expect(result).toEqual("`name` = 'abc'");
    });

    it('should be converted to multiple string', function () {
      const result = queryString.set({ name: 'abc', id: 2323, desc: 'hello' });

      expect(result).toEqual("`name` = 'abc', `id` = 2323, `desc` = 'hello'");
    });

    it('should be converted to multiple string function', function () {
      const result = queryString.set({ name: 'abc', id: 2323, at: 'NOW()' });

      expect(result).toEqual("`name` = 'abc', `id` = 2323, `at` = NOW()");
    });
  });

  describe('delete builder', function () {
    it('should build a delete sql without safe mode', function () {
      const result = queryString.remove('abc');
      expect(result).toEqual('DELETE FROM `abc`');
    });
    it('should build a delete sql', function () {
      const result = queryString.remove('abc', { name: 'abc' });
      expect(result).toEqual("DELETE FROM `abc` WHERE `name` = 'abc'");
    });
    it('should build a delete sql with many conditions', function () {
      const result = queryString.remove('abc', { name: 'abc', id: 222 });
      expect(result).toEqual("DELETE FROM `abc` WHERE `name` = 'abc' AND `id` = 222");
    });
  });

  describe('update builder', function () {
    it('should be an update sql without where', function () {
      const result = queryString.update('abc', { id: 555 });

      expect(result).toEqual('UPDATE `abc` SET `id` = 555');
    });
    it('should be an update sql with where', function () {
      const result = queryString.update('abc', { id: 555 }, { name: 12 });

      expect(result).toEqual('UPDATE `abc` SET `id` = 555 WHERE `name` = 12');
    });

    it('should be an update sql with many values', function () {
      const result = queryString.update('abc', { id: 555, name: 'abc', at: 'NOW()' }, { name: 12 });

      expect(result).toEqual("UPDATE `abc` SET `id` = 555, `name` = 'abc', `at` = NOW() WHERE `name` = 12");
    });
  });

  describe('insert builder', function () {
    it('should be an insert sql', function () {
      const result = queryString.insert('abc', { id: 555, name: 'abc', at: 'NOW()' });
      expect(result).toEqual("INSERT INTO `abc` SET `id` = 555, `name` = 'abc', `at` = NOW()");
    });
  });

  describe('insert many builder', function () {
    it('should be an insert sql with many values', function () {
      const result = queryString.insertMany('abc', [{ id: 555, name: 'abc', at: 'NOW()' }]);
      expect(result).toEqual("INSERT INTO `abc` (`id`, `name`, `at`) VALUES (`id` = 555, `name` = 'abc', `at` = NOW())");
    });

    it('should be an insert sql with many values', function () {
      const result = queryString.insertMany(
        'abc',
        [
          { id: 555, name: 'abc', at: 'NOW()' },
          { id: 666, name: 'def', at: 'NOW()' },
        ],
        { name: 12 },
      );

      expect(result).toEqual("INSERT INTO `abc` (`id`, `name`, `at`) VALUES (`id` = 555, `name` = 'abc', `at` = NOW()), (`id` = 666, `name` = 'def', `at` = NOW())");
    });
  });
});
