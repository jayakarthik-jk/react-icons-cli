export const node_modules = "node_modules";
export const react_icons = `${node_modules}/react-icons`;
export const icons_manifest = `${react_icons}/lib/esm/iconsManifest.js`;

export const imports = `
import * as React from 'react';

type Svg = React.ComponentProps<"svg">

`;

import * as fs from "fs";

type Config = {
  destination?: string;
};

let config: Config;
try {
  config = JSON.parse(fs.readFileSync("ric.config.json", "utf-8"));
} catch (error) {
  config = {};
}

config.destination = config.destination ?? "src/components/icons.tsx";

export const destinationFile = config.destination;
