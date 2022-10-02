import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['test/unit/'],
  collectCoverageFrom: ['src/**'],
  coveragePathIgnorePatterns: ['src/utils/const.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}

export default jestConfig
