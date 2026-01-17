#!/usr/bin/env node
import { buildCli } from "./cli/index.js";

const program = buildCli();
program.showHelpAfterError();
program.parse(process.argv);
