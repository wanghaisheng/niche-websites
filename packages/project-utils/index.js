const { createWatchApp, createBuildApp } = require("./bundling/app");
const { createBuildFunction, createWatchFunction } = require("./bundling/function");
const { createBuildHandler, createWatchHandler } = require("./bundling/function");
const { createWatchPackage, createBuildPackage } = require("./packages");

module.exports = {
    createBuildApp,
    createWatchApp,

    // Functions.
    createBuildFunction,
    createWatchFunction,
    createBuildHandler,
    createWatchHandler,

    // Packages.
    createWatchPackage,
    createBuildPackage
};
