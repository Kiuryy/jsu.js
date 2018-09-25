(() => {
    "use strict";

    /* global path */
    global.func = new function () {

        const module = {
            find: require("glob-concat"),
            read: require("read-file"),
            remove: require("del"),
            createFile: require("create-file"),
            uglifyjs: require("uglify-es"),
            exec: require("child_process").exec
        };

        /*
         * ################################
         * PRIVATE
         * ################################
         */

        /**
         * Finds the files matching the given list of definitions (files, glob path, ...)
         *
         * @param {Array} files
         * @returns {Promise}
         */
        const find = (files) => {
            return new Promise((resolve) => {
                module.find.sync(files);
                module.find(files, (err, matches) => {
                    if (err) {
                        throw err;
                    }
                    resolve(matches);
                });
            });
        };

        /**
         * Reads the content of the given file
         *
         * @param {string} src
         * @returns {Promise}
         */
        const readFile = (src) => {
            return new Promise((resolve) => {
                module.read(src, {encoding: "utf8"}, (err, content) => {
                    if (err) {
                        throw err;
                    }
                    resolve(content);
                });
            });
        };

        /**
         * Determines the files matching the given definition and calls the given function for each of the files,
         * Waits until the callback function is runned before proceeding to the next file
         *
         * @param {Array} files
         * @param {boolean} flatten ignore the path of the given files and put them directly into the destination
         * @param {function} func
         * @returns {Promise}
         */
        const proceedFiles = (files, flatten = true, func) => {
            return new Promise((resolve) => {
                find(files).then((matches) => {
                    const proceed = (i = 0) => { // will be called once the previous minify process is done -> important to keep the correct order
                        if (matches[i]) {
                            const info = {
                                file: matches[i],
                                fileName: matches[i].replace(new RegExp("^(" + path.src + "|" + path.tmp + ")", "i"), "")
                            };

                            if (flatten) {
                                info.fileName = info.fileName.split(/\//).pop();
                            }

                            if (info.fileName.search(/\./) > -1) { // only proceed files
                                info.ext = info.fileName.split(/\./).pop();

                                new Promise((rslv) => {
                                    func(info, rslv);
                                }).then(() => {
                                    proceed(i + 1);
                                });
                            } else {
                                proceed(i + 1);
                            }
                        } else {
                            resolve();
                        }
                    };

                    proceed();
                });
            });
        };

        /*
         * ################################
         * PUBLIC
         * ################################
         */

        /**
         * Executes the given command
         *
         * @param {string} command
         * @returns {Promise}
         */
        this.cmd = (command) => {
            return new Promise((resolve) => {
                if (typeof command === "object") {
                    command = command.join("&&");
                }

                module.exec(command, (error, stdout, stderr) => {
                    resolve({
                        stdout: stdout,
                        stderr: stderr
                    });
                });
            });
        };
        
        /**
         * Creates a file with the given content
         *
         * @param {string} src
         * @param {string} content
         * @returns {Promise}
         */
        this.createFile = (src, content) => {
            return new Promise((resolve) => {
                this.remove([src]).then(() => { // remove existing file
                    module.createFile(src, content, (err) => { // create file with given content
                        if (err) {
                            throw err;
                        }
                        resolve();
                    });
                });
            });
        };

        /**
         * Removes the given files
         *
         * @param {Array} files
         * @returns {Promise}
         */
        this.remove = (files) => {
            return new Promise((resolve) => {
                module.remove(files).then(() => {
                    resolve();
                });
            });
        };

        /**
         * Minifies the given files and puts them in the given destination
         *
         * @param {Array} files
         * @param {string} dest
         * @param {boolean} flatten ignore the path of the given files and put them directly into the destination
         * @returns {Promise}
         */
        this.minify = (files, dest, flatten = true) => {
            return new Promise((resolve) => {
                proceedFiles(files, flatten, (info, rslv) => {
                    readFile(info.file).then((content) => { // read file
                        switch (info.ext) {
                            case "js": {
                                const result = module.uglifyjs.minify(content, {
                                    output: {
                                        preamble: "/*! " + process.env.npm_package_name + " v" + process.env.npm_package_version + " | (c) " + process.env.npm_package_author_name + " under " + process.env.npm_package_license + " | " + process.env.npm_package_homepage + " */"
                                    },
                                    mangle: {
                                        reserved: ["jsu", "chrome"]
                                    }
                                });
                                if (result.error) {
                                    throw result.error;
                                }
                                content = result.code;
                                break;
                            }
                        }

                        return this.createFile(dest + info.fileName, content); // save file in the output directory
                    }).then(() => {
                        rslv();
                    });
                }).then(() => {
                    resolve();
                });
            });
        };
    };

})();