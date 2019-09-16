import fs from "fs-extra";
import path from "path";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";

export default async function() {
  const services = await fs.readdir(path.join(__dirname, "cdn/services"));
  return services
    .filter(service => service.endsWith(".ts")) // Only .ts files will be bundled
    .map(service => {
      const [name] = service.split(".");
      return {
        input: `cdn/services/${service}`,
        output: {
          dir: "dist/cdn/services",
          entryFileNames: `${name}.js`,
          name,
          format: "umd",
        },
        plugins: [
          resolve(), // so Rollup can find external libraries
          commonjs(), // so Rollup can convert libraries to ES module
          typescript() // so Rollup can convert TypeScript to JavaScript
        ]
      };
    });
}
