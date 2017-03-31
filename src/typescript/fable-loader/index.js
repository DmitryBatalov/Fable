var path = require("path");
var babel = require("babel-core");
var client = require("./src/client.js");
var babelPlugins = require("./src/babel-plugins.js");

var DEFAULT_PORT = 61225;
var fableCoreVersion = null;

function or(option, _default) {
    return option !== void 0 ? option : _default;
}

function join(arg) {
    return Array.isArray(arg) ? arg.join(";") : arg;
}

function ensureArray(obj) {
    return Array.isArray(obj) ? obj : (obj != null ? [obj] : []);
}

module.exports = function(buffer) {
    this.cacheable();
    var callback = this.async();
    var opts = this.loaders[0].options || {};
    var port = or(opts.port, DEFAULT_PORT);

    var babelOptions = opts.babel || {};
    babelOptions.plugins = [
        babelPlugins.transformMacroExpressions,
        babelPlugins.removeUnneededNulls,
    ].concat(babelOptions.plugins || []);

    var msg = {
        path: this.resourcePath,
        define: ensureArray(or(opts.define, [])),
        plugins: ensureArray(or(opts.plugins, [])),
        fableCore: or(opts.fableCore, null),
        declaration: or(opts.declaration, false),
        typedArrays: or(opts.typedArrays, true),
        clampByteArrays: or(opts.clampByteArrays, false),
        extra: opts.extra
    };

    if (opts.fableCore == null) {
        if (fableCoreVersion == null) {
            fableCoreVersion = require("fable-core/package.json").version;
        }
        msg.fableCore = path.join(__dirname, "../fable-core");
        msg.fableCoreVersion = fableCoreVersion;
    }
    else {
        msg.fableCoreVersion = "*";
    }

    console.log("Fable loader sent: " + msg.path)
    // console.log("Full message: " + JSON.stringify(msg))

    client.send(port, JSON.stringify(msg))
        .then(data => {
            var data = JSON.parse(data);
            if (data.error) {
                callback(new Error(data.error));
            }
            else {
                console.log("Fable loader received: " + msg.path);
                ensureArray(data.infos).forEach(x => console.log(x));
                ensureArray(data.warnings).forEach(x => this.emitWarning(x));
                try {
                    var fsCode = null;
                    if (this.sourceMap) {
                        fsCode = buffer.toString();
                        babelOptions.sourceMaps = true;
                        babelOptions.sourceFileName = path.relative(process.cwd(), data.fileName.replace(/\\/g, '/'));
                    }
                    var transformed = babel.transformFromAst(data, fsCode, babelOptions);
                    callback(null, transformed.code, transformed.map);
                }
                catch (err) {
                    callback(err)
                }
            }
        })
        .catch(err => {
            var msg = err.message + "\nMake sure Fable server is running on port " + port;
            callback(new Error(msg))
        })
};
module.exports.raw = true;
