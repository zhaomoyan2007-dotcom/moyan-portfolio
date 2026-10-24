import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { ensurePortAvailable } from '../lib/dev-proxy.mjs';
test('development refuses an occupied proxy port instead of connecting another project',async()=>{
  const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await assert.rejects(ensurePortAvailable(server.address().port),/占用/);}finally{await new Promise(resolve=>server.close(resolve));}
});
