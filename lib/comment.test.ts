import { test, expect } from "vitest";
import { generateBody } from "./comment";

test(`generateBody`, () => {
  expect(generateBody(`body message here`, `success`)).toMatchInlineSnapshot(`
    ":white_check_mark: **Merge Schedule**
    body message here
    <!-- Merge Schedule Pull Request Comment -->"
  `);

  expect(generateBody(`body message here`, `error`)).toMatchInlineSnapshot(`
    ":x: **Merge Schedule**
    body message here
    <!-- Merge Schedule Pull Request Comment -->"
  `);

  expect(generateBody(`body message here`, `warning`)).toMatchInlineSnapshot(`
    ":warning: **Merge Schedule**
    body message here
    <!-- Merge Schedule Pull Request Comment -->"
  `);

  expect(generateBody(`body message here`, `pending`)).toMatchInlineSnapshot(`
    ":hourglass: **Merge Schedule**
    body message here
    <!-- Merge Schedule Pull Request Comment -->"
  `);
});
