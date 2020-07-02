beforeEach(() => {
  jasmine.addMatchers({
    toBeInstance() {
      return {
        compare(actual, expected) {
          return {
            pass: (actual instanceof expected),
          };
        },
      };
    },
  });
});
