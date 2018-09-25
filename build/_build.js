(() => {
    "use strict";

    /* eslint-disable no-console */
    /* global func, path */
    global.build = new function () {

        /**
         * Removes the content of the dist directory
         *
         * @returns {Promise}
         */
        const clean = () => {
            return measureTime((resolve) => {
                func.remove([path.dist + "*"]).then(() => {
                    resolve();
                });
            }, "Cleaned dist directory");
        };

        /**
         * Parses the js files and copies them to the dist directory
         *
         * @returns {Promise}
         */
        const js = () => {
            return measureTime((resolve) => {
                func.minify([
                    path.src + "js/*.js"
                ], path.dist + "js/").then(() => {
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
            for (const dir of ["build", "src/js"]) {
                await measureTime(async (resolve) => {
                    func.cmd("eslint --fix " + dir + "/**/*.js").then((obj) => {
                        if (obj.stdout && obj.stdout.trim().length > 0) {
                            console.error(obj.stdout);
                            process.exit(1);
                        }
                        resolve();
                    });
                }, "Performed eslint check for " + dir);
            }
        };

        /**
         *
         * @param {function} func
         * @param {string} msg
         * @returns {Promise}
         */
        const measureTime = (func, msg) => {
            return new Promise((resolve) => {
                const start = +new Date();
                new Promise(func).then((info) => {
                    const timeInfo = "[" + (+new Date() - start) + " ms]";
                    console.log(" - " + timeInfo + "" + (" ".repeat(10 - timeInfo.length)) + msg + (info ? (" -> " + info) : ""));
                    resolve();
                });
            });
        };

        /**
         *
         */
        this.release = () => {
            return new Promise((resolve) => {
                clean().then(() => {
                    return eslintCheck();
                }).then(() => {
                    return js();
                }).then(() => {
                    resolve();
                });
            });
        };
    };
})();