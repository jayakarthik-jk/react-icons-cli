import ansiEscapes from "ansi-escapes";
import chalk from "chalk";
import figures from "figures";

import {
  createPrompt,
  isBackspaceKey,
  isDownKey,
  isEnterKey,
  isNumberKey,
  isSpaceKey,
  isUpKey,
  PromptConfig,
  useKeypress,
  usePagination,
  usePrefix,
  useState,
} from "@inquirer/core";

import { ErrorType, ReactIconsCLIErrors } from "../lib/error";

import type {} from "@inquirer/type";
type Choice = {
  name: string;
  value: string;
};

type Config = PromptConfig<{
  prefix?: string;
  pageSize?: number;
  choices: Choice[];
}>;

function isAlphabetKey(key: string) {
  return (
    (key.charCodeAt(0) >= 65 && key.charCodeAt(0) <= 90) ||
    (key.charCodeAt(0) >= 97 && key.charCodeAt(0) <= 122)
  );
}

function renderItem({
  item,
  isActive,
  checked,
}: {
  item: Choice;
  isActive: boolean;
  checked: boolean;
}) {
  const line = item.name ?? item.value;

  const checkbox = checked ? chalk.green(figures.circleFilled) : figures.circle;
  const color = isActive ? chalk.cyan : (x: string) => x;
  const prefix = isActive ? figures.arrowRight : " ";
  return color(`${prefix}${checkbox} ${line}`);
}

const prompt = createPrompt<string[], Config>((config, done) => {
  const { prefix = usePrefix(), pageSize, choices } = config;
  const [status, setStatus] = useState<"pending" | "done">("pending");
  const [items, setItems] = useState<Choice[]>(
    choices.map((choice) => ({ ...choice }))
  );
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const [showHelpTip, setShowHelpTip] = useState(true);
  const [checked, setChecked] = useState<string[]>([]);

  useKeypress((key) => {
    if (isEnterKey(key)) {
      setStatus("done");
      done(
        choices
          .filter((item) => checked.includes(item.value))
          .map((choice) => choice.value)
      );
    } else if (isUpKey(key) || isDownKey(key)) {
      const offset = isUpKey(key) ? -1 : 1;
      const next = (active + offset + items.length) % items.length;
      setActive(next);
    } else if (isSpaceKey(key)) {
      setShowHelpTip(false);
      if (checked.includes(items[active]?.value ?? "")) {
        setChecked(checked.filter((item) => item !== items[active]?.value));
      } else {
        setChecked([...checked, items[active]!.value]);
      }
    } else if (isBackspaceKey(key)) {
      const regex = new RegExp(search.slice(0, -1), "i");
      setItems(choices.filter((item) => regex.test(item.value)));
      setSearch(search.slice(0, -1));
      setActive(0);
    } else if (isAlphabetKey(key.name) || isNumberKey(key)) {
      const regex = new RegExp(search + key.name, "i");
      setItems(choices.filter((item) => regex.test(item.value)));
      setSearch(search + key.name);
      setActive(0);
    }
  });

  const message = chalk.bold(config.message);

  const lines = items
    .map((item, index) =>
      renderItem({
        item,
        isActive: index === active,
        checked: checked.includes(item.value),
      })
    )
    .join("\n");

  const page = usePagination(lines, {
    active,
    pageSize,
  });

  if (status === "done") {
    const selection = choices
      .filter((item) => checked.includes(item.value))
      .map((item) => item.value);
    return `${prefix} ${message} ${chalk.cyan(selection.join(", "))}`;
  }

  let helpTip = "";
  if (showHelpTip) {
    const keys = [
      `${chalk.cyan.bold("<space>")} to select`,
      `${chalk.cyan.bold("<a>")} to toggle all`,
      `${chalk.cyan.bold("<i>")} to invert selection`,
      `and ${chalk.cyan.bold("<enter>")} to proceed`,
    ];
    helpTip = ` (Press ${keys.join(", ")})`;
  }
  const searchQuery = chalk.dim(`>Search: ${search}`);
  return `${prefix} ${message}${helpTip}\n${searchQuery}\n${page}${ansiEscapes.cursorHide}`;
});

export const checkbox = async (props: {
  message: string;
  choices: Choice[];
}) => {
  try {
    return await prompt(props);
  } catch (error) {
    throw new ReactIconsCLIErrors(ErrorType.USER_CANCELED);
  }
};
