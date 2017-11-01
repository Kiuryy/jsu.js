(() => {
    "use strict";

    /* global func, path */
    global.build = new function () {

        /**
         * Removes the content of the dist directory
         *
         * @returns {Promise}
         */
        let clean = () => {
            return new Promise((resolve) => {
                func.remove([path.dist + "*"]).then(() => {
                    resolve();
                });
            });
        };

        /**
         * Parses the js files and copies them to the dist directory
         *
         * @returns {Promise}
         */
        let js = () => {
            return new Promise((resolve) => {
                func.minify([
                    path.src + "js/*.js"
                ], path.dist + "js/").then(() => {
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
                    return js();
                }).then(() => {
                    resolve();
                });
            });
        };
    };
})();