const SERVER_ERROR_MIN = 500

const retryPolicy = { attempts: 3, delayMs: 1000 }

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function fetchWithRetry(url, options) {
  for (let attempt = 1; ; attempt += 1) {
    const isLast = attempt >= retryPolicy.attempts
    let response
    try {
      response = await fetch(url, options)
    } catch (error) {
      if (isLast) throw error
    }
    if (response && (response.status < SERVER_ERROR_MIN || isLast)) return response
    await wait(retryPolicy.delayMs * attempt)
  }
}

module.exports = { fetchWithRetry, retryPolicy }
