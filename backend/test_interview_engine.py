from interview_engine import InterviewEngine


engine = InterviewEngine()

print("\n==============================")
print("      AI MOCK INTERVIEW")
print("==============================\n")


try:
    question = engine.start_interview()

    while not engine.interview_finished:

        print("\n--------------------------------")
        print(f"Stage: {question['stage']}")
        print(f"Question: {question['question']}")
        print("--------------------------------")

        answer = input("\nYour Answer: ")

        # Don't submit empty answers
        if not answer.strip():
            print("\nPlease provide an answer. You can try again.")
            continue

        result = engine.submit_answer(answer)

        if result["status"] == "finished":
            break

        question = result["question"]

    print("\n==============================")
    print("     INTERVIEW FINISHED")
    print("==============================")

    print("\nProgress:")
    print(engine.get_progress())

    print("\nTotal Answers:")
    print(len(engine.get_answers()))

except KeyboardInterrupt:
    print("\n\nInterview stopped by user.")

except ValueError as error:
    print(f"\nError: {error}")