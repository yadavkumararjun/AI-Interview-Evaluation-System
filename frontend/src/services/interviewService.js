import axios from "axios"

const API = "http://127.0.0.1:8000/api"

export async function startInterview() {
  const { data } = await axios.post(
    `${API}/interview/start`
  )

  return data
}

export async function submitAnswer(answer) {
  const { data } = await axios.post(
    `${API}/interview/answer`,
    {
      answer
    }
  )

  return data
}

export async function analyzeInterview() {
  const { data } = await axios.post(
    `${API}/interview/analyze`
  )

  return data
}

export async function finishInterview() {
  const { data } = await axios.post(
    `${API}/interview/finish`
  )

  return data
}