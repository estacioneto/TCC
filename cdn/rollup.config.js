import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";

export default [
  // browser-friendly UMD build
  {
    input: {
      index: "services/index.ts"
    },
    output: {
      dir: "dist/services",
      entryFileNames: "[name].js",
      name: 'services',
      format: "umd"
    },
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      typescript() // so Rollup can convert TypeScript to JavaScript
    ]
  }
];
