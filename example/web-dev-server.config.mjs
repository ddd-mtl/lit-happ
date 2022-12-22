import { fromRollup } from '@web/dev-server-rollup';
import rollupReplace from '@rollup/plugin-replace';
const replace = fromRollup(rollupReplace);


/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes('--hmr');

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: true,
  watch: !hmr,
  /** Resolve bare module imports */
  nodeResolve: {
    preferBuiltins: false,
    browser: true,
  },

  rootDir: '../',
  appIndex: './dist/index.html',

  plugins: [
    replace({
      "preventAssignment": true,
      'process.env.ENV': JSON.stringify(process.env.ENV),
      'process.env.ADMIN_PORT': JSON.stringify(process.env.ADMIN_PORT || 8889),
      'process.env.HC_PORT': JSON.stringify(process.env.HC_PORT || 8888),
      '  COMB =': 'window.COMB =',
      delimiters: ['', ''],
    }),
  ],
  // See documentation for all available options
});
