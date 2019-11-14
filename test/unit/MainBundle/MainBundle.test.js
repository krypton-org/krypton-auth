const MainBundle = require("../../../bundles/MainBundle/MainBundle");
const Router = require('../../../bundles/MainBundle/router/Router')

test('Function init exists', () => {
  expect(MainBundle.init).toBeTruthy();
});

test('MainBundle router added', () => {
    const app  = {use: jest.fn()};
    MainBundle.init(app);
    expect(app.use).toHaveBeenCalledTimes(1);
});