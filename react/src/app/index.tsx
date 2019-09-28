import React, { useState, useEffect } from 'react'

const App: React.FC<{}> = () => {
  const [data, setData] = useState<string | number>('Loading...')
  const [counter, setCounter] = useState(1)

  useEffect(() => {
    setTimeout(() => setCounter(counter + 1), 500)
  }, [counter])

  return (
    <div className="flex flex-column justify-center items-center vh-100">
      <div>Hello world!</div>
      <div>(counter: {counter})</div>
    </div>
  )
}

export default App
