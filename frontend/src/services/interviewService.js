import axios from "axios";

const API = "http://127.0.0.1:8000/api";

export async function startInterview(
  role = "web_developer",
  experience_level = "beginner",
  mode = "text"
) {
  const { data } = await axios.post(`${API}/interview/start`, {
    role,
    experience_level,
    mode,
  });

  return data;
}

export async function submitAnswer(answer) {
  const { data } = await axios.post(`${API}/interview/answer`, {
    answer,
  });

  return data;
}

export async function analyzeInterview() {
  const { data } = await axios.post(`${API}/interview/analyze`);

  return data;
}

export async function finishInterview() {
  const { data } = await axios.post(`${API}/interview/finish`);

  return data;
}

export async function getRoles() {
  const { data } = await axios.get(`${API}/interview/roles`);

  return data;
}

export async function getInterviewHistory() {
  const { data } = await axios.get(`${API}/interview/history`);

  return data;
}

export async function getHistoryDetail(recordId) {
  const { data } = await axios.get(`${API}/interview/history/${recordId}`);

  return data;
}

export async function getAnalytics(role = null) {
  const url = role && role !== "all" ? `${API}/interview/analytics?role=${encodeURIComponent(role)}` : `${API}/interview/analytics`;
  const { data } = await axios.get(url);

  return data;
}