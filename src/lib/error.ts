// give descriptive error messages
export enum ErrorType {
  NODE_MODULE_NOT_FOUND = "node_modules folder not found, make sure you are in the root of your project",
  REACT_ICONS_NOT_FOUND = "react-icons package not found. \ntry running 'npm i -D react-icons'",
  REACT_ICONS_MANIFEST_NOT_FOUND = "react-icons manifest not found. \ntry running 'npm i -D react-icons'",
  USER_CANCELED = "canceled",
  CANNOT_PARSE_ICON_NAMES = "Cannot parse icon names",
  CANNOT_PARSE_ICON_PROPS = "Cannot parse icon props",
  CANNOT_UPDATE_COMPONENTS = "Cannot update components. make sure you have the destination folder",
  CANNOT_CREATE_COMPONENTS = "Cannot create components. make sure you have the destination folder",
}

export class ReactIconsCLIErrors extends Error {
  constructor(public type: ErrorType) {
    super(type);
    this.name = "ReactIconCLIErrors";
  }
}
