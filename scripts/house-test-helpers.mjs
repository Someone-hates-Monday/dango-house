// Playwright's waitForFunction predicate must stay synchronous. IPC state is
// asynchronous, so poll it here and await each result before testing it.
export async function waitHouseState(page,predicate,timeout=30000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  const state=await page.evaluate(()=>window.garden.getState());
  if(predicate(state))return state;
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw Error('Timed out waiting for household state');
}
