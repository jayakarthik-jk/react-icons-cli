import ansiEscapes from "ansi-escapes";
import chalk from "chalk";
import figures from "figures";

import {
  createPrompt,
  isBackspaceKey,
  isDownKey,
  isEnterKey,
  isNumberKey,
  isUpKey,
  useKeypress,
  usePagination,
  usePrefix,
  useRef,
  useState,
} from "@inquirer/core";

import { ErrorType, ReactIconsCLIErrors } from "../lib/error";

interface Choice {
  name: string;
  value: string;
}

interface SearchListProps {
  message: string;
  choices: Choice[];
  pageSize?: number;
}

function isAlphabetKey(key: string) {
  return (
    (key.charCodeAt(0) >= 65 && key.charCodeAt(0) <= 90) ||
    (key.charCodeAt(0) >= 97 && key.charCodeAt(0) <= 122)
  );
}

function renderItem({ item, isActive }: { item: Choice; isActive: boolean }) {
  const line = item.name ?? item.value;

  const color = isActive ? chalk.cyan : (x: string) => x;
  const prefix = isActive ? figures.pointer : ` `;
  return color(`${prefix} ${line}`);
}

const prompt = createPrompt<string, SearchListProps>((config, done) => {
  const firstRender = useRef(true);
  const [status, setStatus] = useState<"pending" | "done">("pending");
  const [search, setSearch] = useState("");
  const prefix = usePrefix();

  const choices = config.choices;
  const [items, setItems] = useState(choices);
  const [active, setActive] = useState(0);

  useKeypress((key) => {
    if (isEnterKey(key)) {
      setStatus("done");

      done(items[active]!.value);
    } else if (isUpKey(key) || isDownKey(key)) {
      const offset = isUpKey(key) ? -1 : 1;
      let next = active;
      next = (next + offset + items.length) % items.length;
      setActive(next);
    } else if (isBackspaceKey(key)) {
      const newSearch = search.slice(0, -1);
      setItems(
        choices.filter((item) => new RegExp(newSearch, "i").test(item.value))
      );
      setSearch(newSearch);
    } else if (isAlphabetKey(key.name) || isNumberKey(key)) {
      const newSearch = search + key.name;
      setItems(
        choices.filter((item) => new RegExp(newSearch, "i").test(item.value))
      );
      setSearch(newSearch);
    }
  });

  let message = chalk.bold(config.message);
  if (firstRender.current) {
    firstRender.current = false;
    message += chalk.dim(" (Use arrow keys)");
  }

  const lines = items
    .map((item, index) => renderItem({ item, isActive: index === active }))
    .join("\n");

  const page = usePagination(lines, {
    active,
    pageSize: config.pageSize,
  });

  if (status === "done") {
    return `${prefix} ${message} ${chalk.cyan(items[active]?.value)}`;
  }
  const searchQuery = chalk.dim(`>Search: ${search}`);

  return `${prefix} ${message}\n${searchQuery}\n${page}${ansiEscapes.cursorHide}`;
});

export const selectMenu = async (props: SearchListProps) => {
  try {
    return await prompt(props);
  } catch (error) {
    throw new ReactIconsCLIErrors(ErrorType.USER_CANCELED);
  }
};
