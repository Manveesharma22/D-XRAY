/**
 * DX-RAY Centralized Voice Engine
 * Ensures a consistent, high-fidelity female AI signature across the platform.
 */

const PREFERRED_VOICE_TOKENS = [
    'samantha',           // macOS Premium
    'google us english',  // Chrome Premium
    'victoria',           // macOS
    'zira',               // Windows
    'female',             // Generic Fallback
    'en-us'               // Linguistic Fallback
];

export const getBestFemaleVoice = (synth) => {
    if (!synth) return null;
    const voices = synth.getVoices();

    if (voices.length === 0) return null;

    // Search through our preference hierarchy
    for (const token of PREFERRED_VOICE_TOKENS) {
        const match = voices.find(v => v.name.toLowerCase().includes(token.toLowerCase()));
        if (match) return match;
    }

    // Final fallback to first English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
};

export const createUtterance = (text, voice) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;

    // Clinical AI Parameters
    utterance.rate = 0.88;   // Slightly slower, authoritative
    utterance.pitch = 1.05;  // Slightly elevated for clinical clarity
    utterance.volume = 0.85;

    return utterance;
};
