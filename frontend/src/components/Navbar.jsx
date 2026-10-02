import { Brain } from "lucide-react"

function Navbar() {
  return (
    <header className="nav">

      <div className="brand">

        <div className="logo">
          <Brain size={20} />
        </div>

        <span>
          Interview
          <span className="muted">
            AI
          </span>
        </span>

      </div>

      <div className="navLinks">
        <span>
          Mock Interview
        </span>
      </div>

    </header>
  )
}

export default Navbar