const { Web3 } = require('./client/node_modules/web3');
const abi = require('./client/src/contracts/FundReserveContract.json').abi;
const addr = '0x1b3FB16FDE5690c3C6B06E7D5E4feD72B9aa0092';
const w3 = new Web3('http://127.0.0.1:7545');
const c = new w3.eth.Contract(abi, addr);

async function test() {
  try {
    const r1 = await c.methods.getYearlyReservesByScenario(1, 2023).call();
    console.log('S1 ok, months with data:', r1.filter(x => Number(x.updatedAt) > 0).length);
    if (r1[0]) console.log('S1 Jan:', r1[0].month, r1[0].predictedClaims, r1[0].updatedAt);
  } catch(e) { console.log('S1 ERR:', e.message.substring(0, 200)); }

  try {
    const r2 = await c.methods.getYearlyReservesByScenario(2, 2023).call();
    console.log('S2 ok, months with data:', r2.filter(x => Number(x.updatedAt) > 0).length);
  } catch(e) { console.log('S2 ERR:', e.message.substring(0, 200)); }

  try {
    const m1 = await c.methods.scenarioModel(1).call();
    console.log('model1 version:', m1.modelVersion, 'r2:', m1.r2Score);
  } catch(e) { console.log('model1 ERR:', e.message.substring(0, 200)); }

  try {
    const m2 = await c.methods.scenarioModel(2).call();
    console.log('model2 version:', m2.modelVersion, 'r2:', m2.r2Score);
  } catch(e) { console.log('model2 ERR:', e.message.substring(0, 200)); }

  try {
    const alerts = await c.methods.getLatestAlerts(10).call();
    console.log('alerts ok:', alerts.length);
  } catch(e) { console.log('alerts ERR:', e.message.substring(0, 200)); }
}

test().catch(console.error);
