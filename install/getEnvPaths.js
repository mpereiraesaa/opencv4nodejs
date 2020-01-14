const opencvBuild = require('opencv-build')
const child_process = require('child_process')
const fs = require('fs')
const log = require('npmlog')
const { resolvePath } = require('../lib/commons')

const defaultDir = '/usr/local'
const defaultLibDir = `${defaultDir}/lib`
const defaultIncludeDir = `${defaultDir}/include`
const defaultIncludeDirOpenCV4 = `${defaultIncludeDir}/opencv4`

const envName = process.argv[2];

function getDefaultIncludeDirs() {
  log.info('install', 'OPENCV_INCLUDE_DIR is not set, looking for default include dir')
  if (opencvBuild.isWin()) {
    throw new Error('OPENCV_INCLUDE_DIR has to be defined on windows when auto build is disabled')
  }
  return [defaultIncludeDir, defaultIncludeDirOpenCV4]
}

function getDefaultLibDir() {
  log.info('install', 'OPENCV_LIB_DIR is not set, looking for default lib dir')
  if (opencvBuild.isWin()) {
    throw new Error('OPENCV_LIB_DIR has to be defined on windows when auto build is disabled')
  }
  return defaultLibDir
}

opencvBuild.applyEnvsFromPackageJson()

const libDir = opencvBuild.isAutoBuildDisabled()
  ? (resolvePath(process.env.OPENCV_LIB_DIR) || getDefaultLibDir())
  : resolvePath(opencvBuild.opencvLibDir)

if (!fs.existsSync(libDir)) {
  throw new Error('library dir does not exist: ' + libDir)
}

const libsFoundInDir = opencvBuild
  .getLibs(libDir)
  .filter(lib => lib.libPath)

if (!libsFoundInDir.length) {
  throw new Error('no OpenCV libraries found in lib dir: ' + libDir)
}

const defines = libsFoundInDir
  .map(lib => `OPENCV4NODEJS_FOUND_LIBRARY_${lib.opencvModule.toUpperCase()}`)

const explicitIncludeDir = resolvePath(process.env.OPENCV_INCLUDE_DIR)
const includes = opencvBuild.isAutoBuildDisabled()
  ? (explicitIncludeDir ? [explicitIncludeDir] : getDefaultIncludeDirs())
  : [resolvePath(opencvBuild.opencvInclude), resolvePath(opencvBuild.opencv4Include)]

const libs = opencvBuild.isWin()
  ? libsFoundInDir.map(lib => resolvePath(lib.libPath))
  // dynamically link libs if not on windows
  : ['-L' + libDir]
      .concat(libsFoundInDir.map(lib => '-lopencv_' + lib.opencvModule))
      .concat('-Wl,-rpath,' + libDir)

// defines.forEach(def => log.info('defines', def))
// includes.forEach(inc => log.info('includes', inc))
// libs.forEach(lib => log.info('libs', lib))

const envs = {
  OPENCV4NODEJS_DEFINES: defines,
  OPENCV4NODEJS_INCLUDES: includes,
  OPENCV4NODEJS_LIBRARIES: libs
}

envs[envName].forEach(o => console.log(o));
