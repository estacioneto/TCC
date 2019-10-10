import React, { useState, useEffect, useRef } from 'react'

const App: React.FC<{}> = () => {
  const [data, setData] = useState<string | number>('Loading...')
  const [timer, setTimer] = useState(1)
  const [counter, setCounter] = useState<number | null>(null)
  const [stopCounter, setStopCounter] = useState(true)

  useEffect(() => {
    setTimeout(() => setTimer(timer + 1), 500)
  }, [timer])

  useEffect(() => {
    setTimeout(() => {
      if (!stopCounter) {
        fetch('http://localhost:8080/api/counters/1568400845849', {
          method: 'POST',
        })
          .then(res => res.json())
          .then(response => {
            setCounter(response.data)
          })
      }
    }, 1000)
  }, [counter, stopCounter])

  return (
    <div className="flex flex-column justify-center items-center vh-100">
      <div>Hello world!</div>
      <div>(timer: {timer})</div>
      {counter !== null && <div>Fetched counter: {counter}</div>}
      <button
        onClick={() => {
          setStopCounter(!stopCounter)
        }}
      >
        {stopCounter ? 'Resume' : 'Pause'} fetch counter
      </button>
    </div>
  )
}

export default App
