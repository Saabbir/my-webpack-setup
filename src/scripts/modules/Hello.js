class Hello {
  constructor() {
    this.greetMessage = 'Hello World!'
    this.events()
  }

  events() {
    window.addEventListener('load', () => this.greet())
  }

  greet() {
    console.log(this.greetMessage)
  }
}

export default Hello