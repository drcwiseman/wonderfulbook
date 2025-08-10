#!/bin/bash
export PATH="./node_modules/.bin:$PATH"
NODE_ENV=development node --loader ts-node/esm server/index.ts