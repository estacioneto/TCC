import React, { useState, useEffect, useMemo } from 'react'
import { Typography, Button, Snackbar } from '@material-ui/core'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
  createStyles,
} from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

import { useServiceWorker } from './useServiceWorker'

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      color: theme.palette.success[theme.palette.type],
    },
  })
)

const App: React.FC<{}> = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  )
  const styles = useStyles()

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
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

        <div className="mt4">
          {!navigator.onLine ? (
            <Typography variant="caption" color="error">
              You're offline (response from Service Worker)
            </Typography>
          ) : (
            <Typography variant="caption" className={styles.root}>
              You're online (response from API when Service Worker is
              consistent)
            </Typography>
          )}
        </div>

        <Snackbar
          message="App update available!"
          open={updateReady}
          action={
            <Button color="primary" onClick={updateServiceWorker}>
              Refresh
            </Button>
          }
        />
      </div>
    </ThemeProvider>
  )
}

export default App
