/* eslint-disable no-unused-vars */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GITHUB_REPOSITORY: string;
      INPUT_MERGE_METHOD: string;
      INPUT_TIME_ZONE: string;
    }
  }
}

export {};
