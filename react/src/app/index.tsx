import React, { useState, useEffect } from 'react'
import * as Comlink from 'comlink'

import worker from '../workers/simple.worker'

const simpleWorker = Comlink.wrap<typeof worker>(
  new Worker('../workers/simple.worker.ts', { type: 'module' })
)

const App: React.FC<{}> = () => {
  const [data, setData] = useState<string | number>('Loading...')
  const [counter, setCounter] = useState(1)
  useEffect(() => {
    ;(async () => {
      setData(await simpleWorker())
    })()
  }, [])

  useEffect(() => {
    setTimeout(() => setCounter(counter + 1), 500)
  }, [counter])

  const handleClick = async () => {
    setData(await simpleWorker())
  }

  return (
    <div className="flex flex-column justify-center items-center vh-100">
      <div>Hello world!</div>
      <div>(counter: {counter})</div>
      <div>Now I'm {data}, but if you click</div>
      <button onClick={() => handleClick()}>this button...</button>
    </div>
  )
}

export default App
