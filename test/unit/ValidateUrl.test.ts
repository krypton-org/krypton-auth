import config from '../../src/config';

test("Transform mal-formed URL into well-formed URL",() => {
    config.merge({host: "example.com"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");

    config.merge({host: "://example.com"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");

    config.merge({host: "example.com/"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");

    config.merge({host: "example .com/"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");

    config.merge({host: "www.example.com"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");

    config.merge({host: "://www.example.com"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");

    config.merge({host: "www.example.com/"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");

    config.merge({host: "www.example .com/"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");
})
