import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  verbose: true,
  collectCoverage: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['test/unit/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}

export default jestConfig
