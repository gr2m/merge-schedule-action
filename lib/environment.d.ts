/* eslint-disable no-unused-vars */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_REPOSITORY: string;
      GITHUB_EVENT_PATH: string;
      INPUT_MERGE_METHOD: string;
      INPUT_TIME_ZONE: string;
      INPUT_REQUIRE_STATUSES_SUCCESS: string;
    }
  }
}

export {};
