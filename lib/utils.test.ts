import timezoneMock from "timezone-mock";
import { test, expect } from "vitest";
import {
  getScheduleDateString,
  hasScheduleCommand,
  isValidMergeMethod,
  isValidDate,
  stringifyDate,
} from "./utils";

timezoneMock.register(`UTC`);

test("getScheduleDateString", () => {
  expect(getScheduleDateString(``)).toBe(``);
  expect(getScheduleDateString(`/schedule`)).toBe(``);
  expect(getScheduleDateString(`/schedule 2022-06-08`)).toBe(`2022-06-08`);
  expect(getScheduleDateString(`/schedule 2022-06-08T12:00:00`)).toBe(
    `2022-06-08T12:00:00`
  );
});

test("hasScheduleCommand", () => {
  expect(hasScheduleCommand(null)).toBe(false);
  expect(hasScheduleCommand(``)).toBe(false);
  expect(hasScheduleCommand(`/schedule`)).toBe(false);
  expect(hasScheduleCommand(`/schedule `)).toBe(true);
  expect(hasScheduleCommand(`\n/schedule`)).toBe(false);
  expect(hasScheduleCommand(`\n/schedule `)).toBe(true);
  expect(hasScheduleCommand(`Something\n/schedule`)).toBe(false);
  expect(hasScheduleCommand(`Something /schedule `)).toBe(false);
  expect(hasScheduleCommand(`Something\n/schedule `)).toBe(true);
  expect(hasScheduleCommand(`Something /schedule \nelse`)).toBe(false);
  expect(hasScheduleCommand(`Something\n/schedule \nelse`)).toBe(true);
});

test("isValidMergeMethod", () => {
  expect(isValidMergeMethod(`merge`)).toBe(true);
  expect(isValidMergeMethod(`squash`)).toBe(true);
  expect(isValidMergeMethod(`rebase`)).toBe(true);
  expect(isValidMergeMethod(`bad`)).toBe(false);
});

test("isValidDate", () => {
  expect(isValidDate(`2022-06-08`)).toBe(true);
  expect(isValidDate(`2022-06-08T09:00:00`)).toBe(true);
  expect(isValidDate(`2022-06-08T15:00:00Z`)).toBe(true);
  expect(isValidDate(`2022-16-08`)).toBe(false);
  expect(isValidDate(`2022-16-08T09:00:00`)).toBe(false);
  expect(isValidDate(`2022-16-08T15:00:00Z`)).toBe(false);
});

test("stringifyDate", () => {
  expect(stringifyDate(`2022-06-08`)).toBe(`2022-06-08 00:00:00`);
  expect(stringifyDate(`2022-06-08T09:00:00`)).toBe(`2022-06-08 09:00:00`);
  expect(stringifyDate(`2022-06-08T15:00:00Z`)).toBe(`2022-06-08 15:00:00`);
});
