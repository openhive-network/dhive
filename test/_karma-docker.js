module.exports = function (config) {
  config.set({
    browsers: ['Chromium_no_sandbox'],
    customLaunchers: {
      Chromium_no_sandbox: {
        base: 'ChromiumHeadless',
        flags: ['--no-sandbox']
      }
    },
    frameworks: ['browserify', 'mocha'],
    files: ['_browser.js'],
    preprocessors: {
      '_browser.js': ['browserify']
    },
    browserNoActivityTimeout: 1000 * 60 * 5,
    browserify: {
      debug: true,
      plugin: [['tsify', { project: 'tsconfig.test.json' }]]
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true
  })
}
