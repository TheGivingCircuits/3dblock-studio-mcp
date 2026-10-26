#!/usr/bin/env node
import { main } from '../src/server.mjs';
main().catch(e => { console.error(e); process.exit(1); });
