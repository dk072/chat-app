export interface AITextImprovementResult {
  originalText: string;
  improvedText: string;
  tone: string;
  grammarCorrections: string[];
}

export const improveTextTone = (text: string, tone: string): AITextImprovementResult => {
  const trimmed = text.trim();
  let improvedText = trimmed;
  const grammarCorrections: string[] = [];

  // Capitalize first letter if needed
  if (improvedText.length > 0 && improvedText[0] !== improvedText[0].toUpperCase()) {
    improvedText = improvedText[0].toUpperCase() + improvedText.slice(1);
    grammarCorrections.push('Capitalized sentence starting letter');
  }

  // Ensure trailing punctuation
  if (improvedText.length > 0 && !/[.!?]$/.test(improvedText)) {
    improvedText += '.';
    grammarCorrections.push('Added missing trailing punctuation');
  }

  // Tone transformations
  switch (tone.toUpperCase()) {
    case 'PROFESSIONAL':
      improvedText = improvedText
        .replace(/hey|hi|hello/gi, 'Dear Colleague,')
        .replace(/thx|thanks/gi, 'Thank you very much')
        .replace(/asap/gi, 'at your earliest convenience')
        .replace(/btw/gi, 'incidentally')
        .replace(/pls|please/gi, 'kindly');
      break;

    case 'FRIENDLY':
      improvedText = `Hey there! 😊 ${improvedText} Hope you're having a wonderful day! ✨`;
      break;

    case 'CASUAL':
      improvedText = improvedText
        .replace(/hello|dear/gi, 'hey')
        .replace(/thank you/gi, 'thanks a ton!')
        .replace(/cannot/gi, "can't");
      break;

    case 'CONCISE':
      improvedText = improvedText
        .replace(/in order to/gi, 'to')
        .replace(/due to the fact that/gi, 'because')
        .replace(/at this point in time/gi, 'currently')
        .replace(/please feel free to/gi, 'please');
      break;
  }

  return {
    originalText: text,
    improvedText,
    tone,
    grammarCorrections,
  };
};

export const translateTextContent = (text: string, targetLanguage: string) => {
  const langMap: Record<string, string> = {
    es: ' Spanish',
    fr: ' French',
    de: ' German',
    hi: ' Hindi',
    ja: ' Japanese',
    zh: ' Chinese',
    ar: ' Arabic',
    ru: ' Russian',
  };

  const targetName = langMap[targetLanguage.toLowerCase()] || ` ${targetLanguage}`;
  
  // High quality realistic translation mock wrapper
  return {
    originalText: text,
    translatedText: `[${targetName.trim()}] ${text}`,
    targetLanguage,
  };
};

export const summarizeConversationHistory = (messages: { sender: string; text: string }[]) => {
  if (!messages || messages.length === 0) {
    return {
      summary: 'No message history available to summarize.',
      keyActionItems: [],
      sentiment: 'NEUTRAL',
    };
  }

  const senders = Array.from(new Set(messages.map((m) => m.sender)));
  const totalMsgs = messages.length;
  const sampleTopics = messages.map((m) => m.text).slice(-5).join('; ');

  return {
    summary: `Discussion between ${senders.join(' and ')} covering ${totalMsgs} recent messages. Key topic context: "${sampleTopics.slice(0, 100)}..."`,
    keyActionItems: [
      'Follow up on discussed items',
      'Review shared attachments & links',
    ],
    sentiment: 'POSITIVE',
  };
};
