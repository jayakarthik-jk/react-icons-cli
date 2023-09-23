import { checkbox } from "./cli-components/Checkbox";
import { selectMenu } from "./cli-components/Select";
import {
  genComponent,
  genSvg,
  getIconsManifest,
  parseIconNames,
  parseIconProps,
  updateComponent,
} from "./utils/core";

async function main() {
  const manifest = await getIconsManifest();
  const selectedPackage = await selectMenu({
    message: "Select a package",
    choices: manifest.map((icon) => ({
      name: icon.id + "\t" + icon.name,
      value: icon.id,
    })),
  });
  const icons = await parseIconNames(selectedPackage);

  const selectedIcons = await checkbox({
    message: "Select an icon",
    choices: icons.map((icon) => ({
      name: icon,
      value: icon,
    })),
  });
  const props = await parseIconProps(selectedPackage, selectedIcons);
  const svgs = props.map(genSvg);
  const components = svgs.map((svg, i) => genComponent(selectedIcons[i]!, svg));
  components.map(updateComponent);
  console.log("Done");
}

main();
