import * as fs from "fs/promises";

import { ErrorType, ReactIconsCLIErrors } from "../lib/error";
import {
  destinationFile,
  icons_manifest,
  imports,
  node_modules,
  react_icons,
} from "./constants";

import type { IconManifest, IconTree } from "react-icons";
export const checkNodeModulesExistance = async () => {
  try {
    await fs.access(node_modules);
  } catch (error) {
    throw new ReactIconsCLIErrors(ErrorType.NODE_MODULE_NOT_FOUND);
  }
};
export const checkReactIconsExistance = async () => {
  try {
    await fs.access(react_icons);
  } catch (error) {
    throw new ReactIconsCLIErrors(ErrorType.REACT_ICONS_NOT_FOUND);
  }
};

export const getIconsManifest = async () => {
  await checkNodeModulesExistance();
  await checkReactIconsExistance();
  try {
    const content = (await fs.readFile(icons_manifest, "utf8")).replace(
      "export var IconsManifest = ",
      ""
    );
    const manifest: IconManifest[] = JSON.parse(content);
    return manifest;
  } catch (error) {
    throw new ReactIconsCLIErrors(ErrorType.REACT_ICONS_MANIFEST_NOT_FOUND);
  }
};

export const parseIconNames = async (packageName: string) => {
  try {
    const packageFile = await fs.readFile(
      `${react_icons}/${packageName}/index.d.ts`,
      "utf-8"
    );

    const icons = packageFile
      .split("\n")
      .filter((line) => line.startsWith("export declare const"))
      .map((line) => line.split("export declare const ")[1]!.split(":")[0]!);

    return icons;
  } catch (error) {
    throw new Error(ErrorType.CANNOT_PARSE_ICON_NAMES);
  }
};

export const parseIconProps = async (packageName: string, icons: string[]) => {
  try {
    const iconFile = await fs.readFile(
      `${react_icons}/${packageName}/index.esm.js`,
      "utf-8"
    );
    const result: IconTree[] = [];
    for (const icon of icons) {
      const regex = new RegExp(`export function ${icon}[^]*?\\);`, "g");
      const match = regex.exec(iconFile);
      if (match === null) {
        console.log("Icon not found");
        return [];
      }

      const iconFunction = match[0];
      const svgString = iconFunction
        .split("GenIcon(")[1]!
        .replace(")(props);", "");
      const iconProps: IconTree = JSON.parse(svgString);
      result.push(iconProps);
    }
    return result;
  } catch (error) {
    throw new Error(ErrorType.CANNOT_PARSE_ICON_PROPS);
  }
};

export const genSvg = (icon: IconTree): string => {
  const attributesString = Object.entries(icon.attr)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");
  return `
    <${icon.tag} ${attributesString} {...props}>
      ${icon.child?.map((child) => genSvg(child))?.join("") ?? ""}
    </${icon.tag}>
  `;
};

export const genComponent = (name: string, svg: string) => {
  return `
export const ${name}: React.FC<Svg> = (props) => {
  return (
    ${svg}
  );
};  
  `;
};

export const updateComponent = async (components: string) => {
  const exists = await fs
    .access(destinationFile)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    try {
      await fs.writeFile(destinationFile, imports + components);
    } catch (error) {
      throw new Error(ErrorType.CANNOT_CREATE_COMPONENTS);
    }
  } else {
    try {
      await fs.appendFile(destinationFile, components);
    } catch (error) {
      throw new Error(ErrorType.CANNOT_UPDATE_COMPONENTS);
    }
  }
};
