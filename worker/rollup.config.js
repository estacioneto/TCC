import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";

export default async function() {
  return {
    input: "worker/index.worker.ts",
    output: {
      dir: "dist/",
      entryFileNames: "worker.js",
      format: "umd",
      
    },
    plugins: [
      resolve(), // so Rollup can find external libraries
      commonjs(), // so Rollup can convert libraries to ES module
      typescript({
        tsconfig: "./worker/tsconfig.json"
      }) // so Rollup can convert TypeScript to JavaScript
    ]
  };
}
