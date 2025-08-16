/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const jobTitleInput = document.getElementById('job-title') as HTMLInputElement;
const requiredSkillsInput = document.getElementById('required-skills') as HTMLInputElement;
const candidateInfoInput = document.getElementById('candidate-info') as HTMLTextAreaElement;
const analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
const loader = analyzeBtn.querySelector('.loader') as HTMLElement;
const buttonText = analyzeBtn.querySelector('span') as HTMLElement;
const analysisResultDiv = document.getElementById('analysis-result') as HTMLElement;

/**
 * Sets the loading state for the analysis button.
 */
function setLoading(isLoading: boolean) {
  if (isLoading) {
    analyzeBtn.disabled = true;
    loader.style.display = 'inline-block';
    buttonText.textContent = 'Analyzing...';
  } else {
    analyzeBtn.disabled = false;
    loader.style.display = 'none';
    buttonText.textContent = 'Analyze Candidate';
  }
}

/**
 * Creates the prompt for the Gemini API call.
 */
function createPrompt(): string {
  const jobTitle = jobTitleInput.value.trim();
  const requiredSkills = requiredSkillsInput.value.trim();
  const candidateInfo = candidateInfoInput.value.trim();

  if (!jobTitle || !requiredSkills || !candidateInfo) {
    alert('Please fill in all fields before analyzing.');
    return '';
  }

  return `
    You are an expert AI Hiring Assistant. Your purpose is to provide a professional, concise, and structured analysis of a job candidate based on the provided information.

    ### Analysis Instructions
    1. Summarize: Briefly summarize the candidate's profile and experience.
    2. Evaluate Skills: Assess how well the candidate's skills match the required skills. Rate the match as High, Moderate, or Low.
    3. Identify Flags & Strengths: Point out any potential red flags (e.g., missing qualifications, job hopping) and standout strengths (e.g., exceptional project work, rare skills).
    4. Recommend: Conclude with a clear recommendation: "Shortlist", "Reject", or "Needs Further Review".

    ### Candidate Information
    - Job Title: ${jobTitle}
    - Required Skills: ${requiredSkills}
    - Candidate Resume/Details:
      ${candidateInfo}

    ---
    Please provide the analysis in the following strict format:

    ### Candidate Summary
    [Your summary here]

    ### Skill Match
    [High/Moderate/Low]

    ### Red Flags & Strengths
    [Your points here]

    ### Recommendation
    [Shortlist/Reject/Needs Further Review]
  `;
}

/**
 * Parses the raw text response from the API and formats it into HTML.
 */
function formatAnalysis(text: string): string {
  const sections = {
    'Candidate Summary': '',
    'Skill Match': '',
    'Red Flags & Strengths': '',
    'Recommendation': ''
  };

  const lines = text.split('\n');
  let currentSection: keyof typeof sections | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('### ')) {
      const header = trimmedLine.substring(4).trim() as keyof typeof sections;
      if (header in sections) {
        currentSection = header;
      }
    } else if (currentSection && trimmedLine) {
      sections[currentSection] += `${trimmedLine.replace(/^- /, '<li>')}</li>`;
    }
  }

  for (const key in sections) {
    if (sections[key as keyof typeof sections].includes('<li>')) {
      sections[key as keyof typeof sections] = `<ul>${sections[key as keyof typeof sections]}</ul>`;
    }
  }

  return `
    <div class="result-block">
      <h4>Candidate Summary</h4>
      <p>${sections['Candidate Summary']}</p>
    </div>
    <div class="result-block">
      <h4>Skill Match</h4>
      <p class="skill-match--${sections['Skill Match'].toLowerCase().trim()}">${sections['Skill Match']}</p>
    </div>
    <div class="result-block">
      <h4>Red Flags & Strengths</h4>
      <div>${sections['Red Flags & Strengths']}</div>
    </div>
    <div class="result-block recommendation">
      <h4>Recommendation</h4>
      <p>${sections['Recommendation']}</p>
    </div>
  `;
}

/**
 * Main function to handle the analysis process.
 */
async function handleAnalyzeClick() {
  const prompt = createPrompt();
  if (!prompt) return;

  setLoading(true);
  analysisResultDiv.innerHTML = '<p class="placeholder">Analyzing, please wait...</p>';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });

    const data = await response.json();

    if (data.error) {
      analysisResultDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
      return;
    }

    const analysisHtml = formatAnalysis(data.reply);
    analysisResultDiv.innerHTML = analysisHtml;
  } catch (error) {
    console.error('Error analyzing candidate:', error);
    analysisResultDiv.innerHTML = `<p class="error">An error occurred during analysis.</p>`;
  } finally {
    setLoading(false);
  }
}

analyzeBtn.addEventListener('click', handleAnalyzeClick);
