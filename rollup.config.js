import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import {minify} from 'uglify-es';

const minConfig = {
  inputFile: './cellule.js',
  nodeEnvReplacement: JSON.stringify('production'),
  extraPlugins: [uglify({}, minify)],
  format: 'umd',
  outFilename: 'cellule.min.js'
};
const moduleConfig = {
  inputFile: './cellule.js',
  nodeEnvReplacement: 'process.env.NODE_ENV',
  extraPlugins: [],
  format: 'es',
  outFilename: 'cellule.esm.js'
};
const moduleMinConfig = {
  inputFile: './cellule.js',
  nodeEnvReplacement: JSON.stringify('production'),
  extraPlugins: [uglify({}, minify)],
  format: 'es',
  outFilename: 'cellule.esm.min.js'
};
const devConfig = {
  inputFile: './cellule.js',
  nodeEnvReplacement: 'process.env.NODE_ENV',
  extraPlugins: [],
  format: 'umd',
  outFilename: 'cellule.js'
};

const configuration = (() => {
  if (process.env.NODE_ENV === 'production') {
    return minConfig;
  } else if (process.env.NODE_ENV === 'module') {
    return moduleConfig;
  } else if (process.env.NODE_ENV === 'module-min') {
    return moduleMinConfig;
  } else {
    return devConfig;
  }
})();

export default {
  input: configuration.inputFile,
  name: 'cellule',
  plugins: [
    replace({
      'process.env.NODE_ENV': configuration.nodeEnvReplacement,
    }),
    babel({exclude: 'node_modules/**'})
  ].concat(configuration.extraPlugins),
  output: {
    file: `lib/${configuration.outFilename}`,
    format: configuration.format
  }
}