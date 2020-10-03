import React, { useState, useEffect } from 'react'

const App: React.FC<{}> = () => {
  const [timer, setTimer] = useState(1)
  const [data, setData] = useState({
    generatedString: '',
    generationNumber: 0,
    requests: 0,
  })

  useEffect(() => {
    setTimeout(() => setTimer(timer + 1), 500)
  }, [timer])

  useEffect(() => {
    if (data.requests) {
      setTimeout(() => {
        fetch(
          'http://localhost:8080/api/generate_string/1568400845849/1000000',
          {
            method: 'PUT',
          }
        )
          .then(res => res.json())
          .then(response => {
            setData(data => ({
              generatedString: response.data.value,
              generationNumber: response.data.changes,
              requests: Math.max(0, data.requests - 1),
            }))
          })
      }, 100)
    }
  }, [data])

  return (
    <div className="flex flex-column justify-center items-center vh-100">
      <div>Hello world!</div>
      <div>(timer: {timer})</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {data.generatedString && (
          <>
            <div
              style={{
                maxWidth: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: 15,
              }}
            >
              Generated string: {data.generatedString}
            </div>
            <div>Size: {data.generatedString.length}</div>
            <div>Changes: {data.generationNumber}</div>
            <div>Remaining requests: {data.requests}</div>
          </>
        )}
      </div>
      {!data.requests ? (
        <button
          onClick={() => {
            setData({
              ...data,
              requests: 100,
            })
          }}
        >
          Generate strings
        </button>
      ) : (
        <button
          onClick={() => {
            setData({
              ...data,
              requests: 0,
            })
          }}
        >
          Stop generation
        </button>
      )}
    </div>
  )
}

export default App
