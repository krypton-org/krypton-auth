import config from '../../src/config';

test("Transform mal-formed URL into well-formed URL",() => {
    config.set({});
    expect(config.getDomainAddress()).toBe(null);
    
    config.set({host: "example.com"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");
    expect(config.getDomainAddress()).toBe("example.com");

    config.set({host: "://example.com"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");
    expect(config.getDomainAddress()).toBe("example.com");

    config.set({host: "example.com/"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");
    expect(config.getDomainAddress()).toBe("example.com");

    config.set({host: "example .com/"});
    expect(config.host).toBe("http://example.com");
    expect(config.hostURLObject.href).toBe("http://example.com");
    expect(config.hostURLObject.hostname).toBe("example.com");
    expect(config.getDomainAddress()).toBe("example.com");

    config.set({host: "www.example.com"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");
    expect(config.getDomainAddress()).toBe("www.example.com");

    config.set({host: "://www.example.com"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");
    expect(config.getDomainAddress()).toBe("www.example.com");

    config.set({host: "www.example.com/"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");
    expect(config.getDomainAddress()).toBe("www.example.com");

    config.set({host: "www.example .com/"});
    expect(config.host).toBe("http://www.example.com");
    expect(config.hostURLObject.href).toBe("http://www.example.com");
    expect(config.hostURLObject.hostname).toBe("www.example.com");
    expect(config.getDomainAddress()).toBe("www.example.com");
})
