import '../scss/index.scss'
import Hello from './modules/Hello'

new Hello()

// Webpack Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}