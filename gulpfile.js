const { dest, parallel, series, src, watch } = require('gulp')
const browserSync = require('browser-sync')
const del = require('del')
const run = require('gulp-run')

const server = browserSync.create()

const paths = {
  site: {
    src: ['_site/**/*']
  },
  jekyll: {
    src: ['css/**/*', '_(archives|data|includes|layouts|posts)/**/*', '*.html']
  },
  tailwind: {
    src: ['_css/*', '_site/**/*.html']
  }
}

const clean = () => del(paths.site.src)

function jekyllBuild () {
  var shellCommand = 'bundle exec jekyll build --incremental'
  return src('.').pipe(run(shellCommand))
}

function reload (callback) {
  server.reload()
  callback()
}

function serve (callback) {
  server.init({
    server: '_site',
    ghostMode: false, // do not mirror clicks, reloads, etc. (performance)
    logFileChanges: true,
    logLevel: 'debug',
    open: false // do not open the browser
  })
  callback()
}

function tailwind () {
  var shellCommand = 'npx tailwindcss build _css/brightonruby.css -o css/brightonruby.css'
  return src('.').pipe(run(shellCommand))
}

const watchTemplates = () => watch(paths.jekyll.src, { ignoreInitial: false }, series(jekyllBuild, reload))
const watchSite = () => watch(paths.tailwind.src, { ignoreInitial: false }, series(tailwind, reload))
const build = series(jekyllBuild, tailwind, jekyllBuild)
const dev = series(clean, build, parallel(serve, watchSite, watchTemplates))

exports.clean = clean
exports.tailwind = tailwind
exports.build = series(clean, build)
exports.default = dev
