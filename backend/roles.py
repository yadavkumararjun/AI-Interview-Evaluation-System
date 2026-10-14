"""
Role definitions and validation for AI Interview Evaluation System.
Supported roles:
  1. web_developer
  2. ai_engineer
  3. ml_engineer
  4. data_engineer
  5. backend_developer
  6. data_analyst
"""

SUPPORTED_ROLES = {
    "web_developer": {
        "id": "web_developer",
        "title": "Web Developer",
        "short_description": "Build, optimize, and maintain responsive web applications, modern UI/UX, and client-server integrations.",
        "skills": ["HTML/CSS", "JavaScript", "React", "REST APIs", "Web Performance"],
        "technical_categories": ["Web Development", "OOP", "DBMS", "Computer Networks", "DSA"],
        "coding_categories": ["Strings", "Arrays", "DSA"],
    },
    "ai_engineer": {
        "id": "ai_engineer",
        "title": "AI Engineer",
        "short_description": "Design and deploy AI systems, LLM integrations, prompt architectures, and intelligent agents.",
        "skills": ["LLMs", "Prompt Engineering", "Python", "RAG", "Vector Databases", "API Integration"],
        "technical_categories": ["AI/ML", "DSA", "DBMS", "OOP", "Operating Systems"],
        "coding_categories": ["DSA", "Arrays", "Strings"],
    },
    "ml_engineer": {
        "id": "ml_engineer",
        "title": "Machine Learning Engineer",
        "short_description": "Develop, train, evaluate, and productionize machine learning models and predictive pipelines.",
        "skills": ["Machine Learning", "Python", "PyTorch/TensorFlow", "Scikit-Learn", "Model Deployment"],
        "technical_categories": ["AI/ML", "DSA", "DBMS", "OOP"],
        "coding_categories": ["DSA", "Arrays"],
    },
    "data_engineer": {
        "id": "data_engineer",
        "title": "Data Engineer",
        "short_description": "Build reliable data pipelines, distributed architectures, ETL workflows, and scalable warehouses.",
        "skills": ["SQL", "Python", "ETL Pipelines", "Data Warehousing", "Distributed Systems"],
        "technical_categories": ["DBMS", "Operating Systems", "DSA", "Computer Networks", "OOP"],
        "coding_categories": ["DSA", "Arrays"],
    },
    "backend_developer": {
        "id": "backend_developer",
        "title": "Backend Developer",
        "short_description": "Design scalable server architectures, robust APIs, database schemas, and microservices.",
        "skills": ["Python/Node/Java", "FastAPI/Express", "Databases & SQL", "API Design", "System Architecture"],
        "technical_categories": ["DBMS", "Computer Networks", "Operating Systems", "OOP", "Web Development"],
        "coding_categories": ["DSA", "Arrays", "Strings"],
    },
    "data_analyst": {
        "id": "data_analyst",
        "title": "Data Analyst",
        "short_description": "Extract actionable business insights, analyze structured data, build metrics, and test hypotheses.",
        "skills": ["SQL", "Python/R", "Data Visualization", "Statistical Analysis", "Business Metrics"],
        "technical_categories": ["DBMS", "AI/ML", "DSA"],
        "coding_categories": ["Arrays", "Strings"],
    },
}

SUPPORTED_EXPERIENCE_LEVELS = {
    "beginner": {
        "id": "beginner",
        "title": "Beginner",
        "description": "0-1 years • Entry Level / Student • Core concepts and fundamentals",
    },
    "intermediate": {
        "id": "intermediate",
        "title": "Intermediate",
        "description": "1-3 years • Practical application, real-world trade-offs, and best practices",
    },
    "advanced": {
        "id": "advanced",
        "title": "Advanced",
        "description": "3+ years • Senior depth, architecture, scale, and high-impact decision making",
    },
}

DEFAULT_ROLE = "web_developer"
DEFAULT_EXPERIENCE_LEVEL = "beginner"


def validate_role(role_id: str) -> str:
    """Validate role string against supported roles."""
    if not role_id or not isinstance(role_id, str):
        raise ValueError(
            f"Role is required. Supported roles: {', '.join(SUPPORTED_ROLES.keys())}"
        )

    normalized = role_id.strip().lower()
    if normalized not in SUPPORTED_ROLES:
        raise ValueError(
            f"Invalid role '{role_id}'. Supported roles: {', '.join(SUPPORTED_ROLES.keys())}"
        )

    return normalized


def validate_experience_level(level: str) -> str:
    """Validate experience level string against supported levels."""
    if not level or not isinstance(level, str):
        return DEFAULT_EXPERIENCE_LEVEL

    normalized = level.strip().lower()
    if normalized not in SUPPORTED_EXPERIENCE_LEVELS:
        raise ValueError(
            f"Invalid experience level '{level}'. Supported levels: {', '.join(SUPPORTED_EXPERIENCE_LEVELS.keys())}"
        )

    return normalized


def get_role_details(role_id: str) -> dict:
    """Get metadata for a role."""
    normalized = validate_role(role_id)
    return SUPPORTED_ROLES[normalized]
