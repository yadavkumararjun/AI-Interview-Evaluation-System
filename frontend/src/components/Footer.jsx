import { Brain, Shield, Sparkles, Terminal } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footerContent">
        <div className="footerBrand">
          <div className="footerLogo">
            <Brain size={18} aria-hidden="true" />
            <span>Interview<strong>AI</strong></span>
          </div>
          <p className="footerDesc">
            A modern, rubric-aligned mock interview preparation system designed to
            build confidence across technical and behavioral rounds.
          </p>
        </div>

        <div className="footerColumns">
          <div className="footerCol">
            <h4>Format</h4>
            <ul>
              <li><span>7 Practice Stages</span></li>
              <li><span>15 Standard Questions</span></li>
              <li><span>Text & Voice Modalities</span></li>
            </ul>
          </div>

          <div className="footerCol">
            <h4>Evaluation Rubric</h4>
            <ul>
              <li><span>Communication & Clarity</span></li>
              <li><span>Technical Understanding</span></li>
              <li><span>Behavioral & STAR Method</span></li>
            </ul>
          </div>

          <div className="footerCol">
            <h4>Privacy & Mode</h4>
            <ul>
              <li><span>Client-side Speech API</span></li>
              <li><span>Zero Persistent Tracking</span></li>
              <li><span>Instant Report Generation</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footerBottom">
        <p>© {new Date().getFullYear()} InterviewAI Evaluator. Built for technical interview preparation.</p>
        <div className="footerMeta">
          <span className="footerPill">
            <Sparkles size={12} /> Rubric Evaluated
          </span>
          <span className="footerPill">
            <Shield size={12} /> Practice Only
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
