# Let's talk about workers :)

## Running the project

To run this project, you must have three opened terminals in order to start the `/react`, `/api` and `/worker` servers. In development mode, you shoud run the following commands:

```sh
# To install all dependencies, just run this command on project's root.
yarn

# For each folder (/react, /api and /worker), run:
yarn dev
```

## What does this project do?

Well, the app is really simple. A string generation app! And there were a few concepts that I wanted to talk about when building this project.

### First of all, Service Workers!

[Service workers](https://developers.google.com/web/fundamentals/primers/service-workers) are great and they are present in the web for a long time. It helps the web app by adding a new layer that can deal with cache, intercepting network requests, preloading pages and data, and so on. In this project, the service worker that is served in the `/worker` folder helps the app by generating data even when the API is unavailable.

### API

TODO

### Code sharing

TODO

#### Database abstraction

TODO

## /har folder

The `/har` folder was meant to run analysis on network requests (exported on Chrome). It was crucial to make my undergraduate thesis and you can read it in portuguese [here](https://drive.google.com/file/d/135eR09Zz-p9mTJHRHPqIfZWN3GV2bXXS/view).
