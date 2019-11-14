const config = require("../../config/config");



test('Function getConfiguredApp exists', () => {
  expect(config.init).toBeTruthy();
});

test('Function getConfiguredApp to return a function', () => {
  const useMock = jest.fn();
  const setMock = jest.fn();
  const app = {
    use:useMock,
    set:setMock
  }
  config.init(app)
  expect(useMock.mock.calls.length).toBe(11);
  expect(setMock.mock.calls.length).toBe(1);
});