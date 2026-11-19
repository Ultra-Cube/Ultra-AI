// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { createRoot } from "react-dom/client"

import App from "./App"
import { ErrorBoundary } from "./ErrorBoundary"
import { LocaleProvider } from "./i18n"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </ErrorBoundary>,
)
