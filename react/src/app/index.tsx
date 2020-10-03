import React, { useState, useEffect } from 'react'
import { Typography, Button, Snackbar } from '@material-ui/core'
import { useServiceWorker } from './useServiceWorker'

const App: React.FC<{}> = () => {
  const { updateReady, updateServiceWorker } = useServiceWorker()

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
      <Typography variant="h3" component="h1">
        Let's generate strings!
      </Typography>
      <Typography variant="h5" component="h2">
        Open the console to see the Service Worker magic ✨
      </Typography>
      <Typography variant="h6" component="h3">
        A counter to see the app is running: {timer}
      </Typography>
      <Typography variant="subtitle1" component="h4">
        (Just to show the page didn't freeze)
      </Typography>
      <div className="mb4 flex flex-column items-center">
        {data.generatedString && (
          <>
            <Typography
              variant="body1"
              style={{
                maxWidth: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: 15,
              }}
            >
              Generated string: {data.generatedString}
            </Typography>
            <Typography variant="subtitle2">
              Size:&nbsp;
              {new Intl.NumberFormat().format(data.generatedString.length)}
            </Typography>
            <Typography variant="subtitle2">
              Changes: {data.generationNumber}
            </Typography>
            <Typography variant="body2">
              Remaining requests: {data.requests}
            </Typography>
            <Typography variant="caption">
              If the string content is too big it can slow down the browser
            </Typography>
          </>
        )}
      </div>
      {!data.requests ? (
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            setData({
              ...data,
              requests: 100,
            })
          }}
        >
          Generate strings
        </Button>
      ) : (
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            setData({
              ...data,
              requests: 0,
            })
          }}
        >
          Stop generation
        </Button>
      )}

      <Snackbar
        message="App update available!"
        open={updateReady}
        action={<Button color="primary" onClick={updateServiceWorker}>Refresh</Button>}
      />
    </div>
  )
}

export default App
