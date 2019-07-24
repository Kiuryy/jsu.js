(() => {
    "use strict";

    /* eslint-disable no-console */
    /* global Func, path */

    global.modulePath = __dirname + "/node_modules/";

    try {
        require("../node.js_Build/funcs");
    } catch (e) {
        if (e.code !== "MODULE_NOT_FOUND") {
            throw e;
        }
        console.error("Build script is missing. Please download from https://github.com/Kiuryy/node.js_Build");
        process.exit(1);
    }

    // SCSS Filewatcher -> <PATH_TO_node>/npm.cmd run scss

    /**
     * Starts building the application
     */
    const Build = () => {
        const start = +new Date();
        console.log("Building release...\n");

        Func.cleanPre().then(() => {
            return eslintCheck();
        }).then(() => {
            return js();
        }).then(() => {
            return Func.cleanPost();
        }).then(() => {
            console.log("\nRelease built successfully\t[" + (+new Date() - start) + " ms]");
        });
    };

    /*
     * ################################
     * BUILD FUNCTIONS
     * ################################
     */

    /**
     * Parses the js files and copies them to the dist directory
     *
     * @returns {Promise}
     */
    const js = () => {
        return Func.measureTime((resolve) => {
            Func.minify([
                path.src + "js/*.js"
            ], path.dist).then(() => {
                resolve();
            });
        }, "Moved js files to dist directory");
    };

    /**
     * Performs eslint checks for the build and src/js directories
     *
     * @returns {Promise}
     */
    const eslintCheck = async () => {
        for (const files of ["build.js", path.src + "js/**/*.js"]) {
            await Func.measureTime(async (resolve) => {
                Func.cmd("eslint --fix " + files).then((obj) => {
                    if (obj.stdout && obj.stdout.trim().length > 0) {
                        console.error(obj.stdout);
                        process.exit(1);
                    }
                    resolve();
                });
            }, "Performed eslint check for " + files);
        }
    };

    //
    //
    //
    Build();
})();