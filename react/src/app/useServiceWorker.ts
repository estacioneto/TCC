import { useEffect, useState, useRef } from 'react'

export function useServiceWorker() {
  const [updateReady, setUpdateReady] = useState(false)
  const [installing, setInstalling] = useState(false)
  const workerRef = useRef<ServiceWorker | null>(null)

  function updateServiceWorker() {
    setUpdateReady(false)
    workerRef.current?.postMessage({ action: 'skipWaiting' })
  }

  useEffect(() => {
    let swRegistration: ServiceWorkerRegistration | null = null
    function updateFoundHandler() {
      workerRef.current = swRegistration?.installing ?? null
      setInstalling(true)
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker?v=1', { scope: '/' }).then(
        registration => {
          // Registration was successful
          console.log(
            'ServiceWorker registration successful with scope: ',
            registration.scope
          )
          swRegistration = registration

          if (!navigator.serviceWorker.controller) {
            return
          }

          if (registration.waiting) {
            setUpdateReady(true)
            workerRef.current = registration.waiting
            return
          }
          if (registration.installing) {
            workerRef.current = registration.installing
            setInstalling(true)
            return
          }

          registration.addEventListener('updatefound', updateFoundHandler)
        },
        err => {
          // registration failed :(
          console.log('ServiceWorker registration failed: ', err)
        }
      )
    }
    return () =>
      swRegistration?.removeEventListener?.('updatefound', updateFoundHandler)
  }, [])

  useEffect(
    function trackInstallation() {
      function stateChangeHandler() {
        if (workerRef.current?.state === 'installed') {
          setInstalling(false)
          setUpdateReady(true)
        }
      }
      if (installing) {
        workerRef.current?.addEventListener?.('statechange', stateChangeHandler)
      }

      return () => {
        if (installing) {
          workerRef.current?.removeEventListener?.(
            'statechange',
            stateChangeHandler
          )
        }
      }
    },
    [installing]
  )

  useEffect(function updateServiceWorkerListener() {
    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing = false
    function controllerChangeHandler() {
      if (refreshing) return
      window.location.reload()
      refreshing = true
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      controllerChangeHandler
    )

    return () =>
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        controllerChangeHandler
      )
  }, [])

  return { updateReady, updateServiceWorker }
}
