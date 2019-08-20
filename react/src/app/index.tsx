import React, { useState, useEffect } from 'react'
import * as Comlink from 'comlink'

import worker from '../workers/simple.worker'

const simpleWorker = Comlink.wrap<typeof worker>(
  new Worker('../workers/worker.js', { type: 'module' })
)

const App: React.FC<{}> = () => {
  const [data, setData] = useState<string | number>('Loading...')
  const [counter, setCounter] = useState(1)
  const [instance, setInstance] = useState<any>(null)
  useEffect(() => {
    ;(async () => {
      const instance = await new simpleWorker()
      console.log(instance)
      setInstance(instance)
    })()
  }, [])

  useEffect(() => {
    setTimeout(() => setCounter(counter + 1), 500)
  }, [counter])

  const handleClick = async () => {
    if (instance) {
      setData(await instance.getNext())
    }
  }

  return (
    <div className="flex flex-column justify-center items-center vh-100">
      <div>Hello world!</div>
      <div>(counter: {counter})</div>
      {instance && (
        <>
          <div>Now I'm {data}, but if you click</div>
          <button onClick={() => handleClick()}>this button...</button>
        </>
      )}
    </div>
  )
}

export default App
