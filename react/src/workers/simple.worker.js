let x = 1
class worker {
  getNext() {
    let i = 0
    console.log('Worker is calculating so much...')
    while (i++ < 1e9) x++
    console.log('Worker calculated...')
  }
}

export default worker
