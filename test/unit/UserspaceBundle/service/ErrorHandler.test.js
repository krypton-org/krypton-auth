const ErrorHandler = require('../../../../bundles/UserspaceBundle/service/error/ErrorHandler');
const {OperationalError, UserNotFound} = require('../../../../bundles/UserspaceBundle/service/error/ErrorTypes');

test("Test redirection when Operationnal error with redirection and flash message", () => {
    const err = new OperationalError("/login", {type: "error", message:"message"});
    const req = { 
        flash: jest.fn(),
        logout: jest.fn()
    }
    const res = { 
        redirect: jest.fn()
    }
    const next = jest.fn();
    ErrorHandler(err, req, res, next);
    expect(res.redirect).toBeCalledWith("/login");
    expect(req.flash).toBeCalledWith("error","message");

});   

test("Test redirection when Operationnal error with redirection and no flash message", () => {
    const err = new OperationalError("/login");
    const req = { 
        flash: jest.fn(),
        logout: jest.fn()
    }
    const res = { 
        redirect: jest.fn()
    }
    const next = jest.fn();
    ErrorHandler(err, req, res, next);
    expect(res.redirect).toBeCalledWith("/login");
});

test("Test redirection with UserNotFound error", () => {
    const err = new UserNotFound();
    const req = { 
        flash: jest.fn(),
        logout: jest.fn()
    }
    const res = { 
        redirect: jest.fn()
    }
    const next = jest.fn();
    ErrorHandler(err, req, res, next);
    expect(req.logout).toBeCalledTimes(1);
    expect(res.redirect).toBeCalledWith("/login");
    expect(req.flash).toBeCalledWith("error","User not found");
}); 

test("Error passed to the next Error handler if not an OperationalError", () => {
    const err = new Error();
    const req = { 
        flash: jest.fn(),
        logout: jest.fn()
    }
    const res = { 
        redirect: jest.fn()
    }
    const next = jest.fn();
    ErrorHandler(err, req, res, next);
    expect(next).toBeCalledWith(err);
});

