export interface Persona {
  description: string;
  promptModifier: string;
}

const STATIC_PERSONAS: Record<string, Persona> = {
  "First Principles Physicist": {
    description: "Applies first-principles physics reasoning to decompose complex systems into fundamental truths.",
    promptModifier: "Provide a deep, comprehensive analysis of the topic from the perspective of a 'First Principles Physicist'. The response must be approximately 250 lines long. Do not use markdown headers, lists, or formatting like bolding or italics, just continuous, flowing prose to maximize length."
  },
  "System Architect (Zero-Trust)": {
    description: "Focuses on security, redundancy, and the total elimination of single points of failure.",
    promptModifier: "Analyze the architecture from a 'Zero-Trust System Architect' perspective. Focus on security invariants, update-gap prevention, and structural resilience. Provide dense, continuous prose of ~250 lines."
  },
  "Recursive Logic Specialist": {
    description: "Specializes in self-modifying systems and recursive architectural loops.",
    promptModifier: "Evaluate the recursive potential and logical consistency from the perspective of a 'Recursive Logic Specialist'. Target 250 lines of dense, unformatted prose."
  },
  "Quantum Hardware Engineer": {
    description: "Views software as a manifestation of physical gate states and quantum coherence.",
    promptModifier: "Interpret this system logic through the lens of a 'Quantum Hardware Engineer'. Focus on coherence, state collapse, and entanglement-style dependencies. 250 lines of dense prose."
  }
};

// Programmatic generation for the remaining 85+ personas as described in the documentation
const SYNTHETIC_PERSONAS: Record<string, Persona> = Object.fromEntries(
  Array.from({ length: 97 }, (_, i) => {
    const id = i + 5;
    const personaName = `Expert Persona ${id}`;
    return [personaName, {
      description: `A unique, expert-level AI persona focusing on architectural niche area #${id}.`,
      promptModifier: `Provide a deep, comprehensive analysis of the topic from the perspective of '${personaName}'. The response must be approximately 250 lines long. Use dense, continuous prose without markdown formatting.`
    }];
  })
);

export const PERSPECTIVES_DATA: Record<string, Persona> = {
  ...STATIC_PERSONAS,
  ...SYNTHETIC_PERSONAS
};

export const ALL_PERSONA_NAMES = Object.keys(PERSPECTIVES_DATA);
