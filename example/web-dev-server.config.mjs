import { fromRollup } from '@web/dev-server-rollup';
import rollupReplace from "@rollup/plugin-replace";
import rollupCommonjs from "@rollup/plugin-commonjs";
import rollupBuiltins from 'rollup-plugin-node-builtins';
//import rollupGlobals from 'rollup-plugin-node-globals';

const replace = fromRollup(rollupReplace);
const commonjs = fromRollup(rollupCommonjs);
const builtins = fromRollup(rollupBuiltins);
//const globals = fromRollup(rollupGlobals);


/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes('--hmr');

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: true,
  watch: !hmr,
  /** Resolve bare module imports */
  nodeResolve: {
    preferBuiltins: false,
    browser: true,
    exportConditions: ['browser', 'development'],
  },

  rootDir: '../',
  appIndex: './index.html',

  plugins: [
    replace({
      "preventAssignment": true,
      //'process.env.ENV': JSON.stringify(process.env.ENV),
      'process.env.HC_ADMIN_PORT': JSON.stringify(process.env.ADMIN_PORT || 8889),
      'process.env.HC_APP_PORT': JSON.stringify(process.env.HC_PORT || 8888),
      '  COMB =': 'window.COMB =',
      delimiters: ['', ''],
    }),
    builtins(),
    commonjs({}),
  ],
  // See documentation for all available options
});
