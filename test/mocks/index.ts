import { setupServer } from "msw/node";
import { githubHandlers } from "./github";

export const server = setupServer(...githubHandlers);
