import * as Comlink from 'comlink'

let x = 1

function worker() {
  let i = 0;
  console.log('Worker is calculating so much...')
  while (i++ < 1e9) x++
  console.log('Worker calculated...')
  return x
}

Comlink.expose(worker)

export default worker
