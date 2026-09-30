from gemini_service import analyze_interview


answers = [
    {
        "question": "Tell me about yourself.",
        "stage": "introduction",
        "answer": "I am a Computer Engineering student interested in software development and AI."
    },
    {
        "question": "What are your strengths?",
        "stage": "behavioral",
        "answer": "My strength is that I enjoy learning new technologies and solving programming problems."
    },
    {
        "question": "What is polymorphism in OOP?",
        "stage": "technical",
        "answer": "Polymorphism means one interface can have different implementations. Method overriding is a common example."
    },
    {
        "question": "Tell me about a project you worked on.",
        "stage": "project_discussion",
        "answer": "I built a MERN application. I worked on the frontend and backend and connected the application with MongoDB."
    }
]


result = analyze_interview(answers)

print("\n===== INTERVIEW ANALYSIS =====\n")

print(result)