import prisma from '../config/db';

const SPAM_KEYWORDS = ['buy now', 'crypto investment', 'free bitcoin', 'telegram link', 'claim prize', 'cash reward', 'whatsapp number'];
const PHISHING_KEYWORDS = ['login-verify', 'account-update', 'bank-security', 'password-reset-urgent', 'verify-wallet', 'seed-phrase'];
const ABUSIVE_KEYWORDS = ['idiot', 'stupid', 'scammer', 'fraud', 'jerk', 'trash', 'asshole'];
const HATE_SPEECH_KEYWORDS = ['hate', 'die', 'kill', 'threat', 'racist', 'slur'];
const DISPOSABLE_DOMAINS = ['mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 'yopmail.com'];

export interface ModerationAnalysisResult {
  riskScore: number;
  flags: string[];
  actionTaken?: 'WARNING' | 'MUTE' | 'BAN' | 'NONE';
  recommendation: string;
  details: {
    isSpam: boolean;
    isPhishing: boolean;
    isAbusive: boolean;
    isHateSpeech: boolean;
    isFakeAccount: boolean;
    isBot: boolean;
    isNSFW: boolean;
  };
}

export const analyzeTextContent = (text: string): ModerationAnalysisResult => {
  const lowerText = text.toLowerCase();
  const flags: string[] = [];
  let riskScore = 0;

  const isSpam = SPAM_KEYWORDS.some((kw) => lowerText.includes(kw)) || (text.match(/https?:\/\//g) || []).length >= 3;
  const isPhishing = PHISHING_KEYWORDS.some((kw) => lowerText.includes(kw));
  const isAbusive = ABUSIVE_KEYWORDS.some((kw) => lowerText.includes(kw));
  const isHateSpeech = HATE_SPEECH_KEYWORDS.some((kw) => lowerText.includes(kw));
  
  // Bot pattern: repeated capital words, suspicious repetition
  const isBot = /([A-Z]{4,}\s+){3,}/.test(text) || (text.length > 50 && new Set(text.split(' ')).size < text.split(' ').length * 0.3);

  if (isSpam) {
    flags.push('SPAM_DETECTED');
    riskScore += 25;
  }
  if (isPhishing) {
    flags.push('PHISHING_SUSPECT');
    riskScore += 45;
  }
  if (isAbusive) {
    flags.push('ABUSIVE_LANGUAGE');
    riskScore += 20;
  }
  if (isHateSpeech) {
    flags.push('HATE_SPEECH');
    riskScore += 50;
  }
  if (isBot) {
    flags.push('BOT_AUTOMATION_PATTERN');
    riskScore += 30;
  }

  riskScore = Math.min(100, riskScore);

  let actionTaken: 'WARNING' | 'MUTE' | 'BAN' | 'NONE' = 'NONE';
  let recommendation = 'Low risk. No automated action required.';

  if (riskScore >= 75) {
    actionTaken = 'BAN';
    recommendation = 'Critical Threat: Recommend immediate user suspension and message removal.';
  } else if (riskScore >= 45) {
    actionTaken = 'MUTE';
    recommendation = 'Moderate Threat: Recommend temporary chat mute and user warning.';
  } else if (riskScore >= 20) {
    actionTaken = 'WARNING';
    recommendation = 'Minor Risk: Issue automated content policy warning.';
  }

  return {
    riskScore,
    flags,
    actionTaken,
    recommendation,
    details: {
      isSpam,
      isPhishing,
      isAbusive,
      isHateSpeech,
      isFakeAccount: false,
      isBot,
      isNSFW: false,
    },
  };
};

export const analyzeUserAccountRisk = (user: { username: string; email: string; createdAt: Date }): ModerationAnalysisResult => {
  const flags: string[] = [];
  let riskScore = 0;
  const domain = user.email.split('@')[1]?.toLowerCase() || '';

  const isDisposable = DISPOSABLE_DOMAINS.includes(domain);
  const isFakeAccount = isDisposable || /^[a-z0-9]{12,}$/.test(user.username) || /user\d{7,}/.test(user.username);
  const isBot = /bot\d+/i.test(user.username);

  const accountAgeHours = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);

  if (isDisposable) {
    flags.push('DISPOSABLE_EMAIL_DOMAIN');
    riskScore += 35;
  }
  if (isFakeAccount) {
    flags.push('SUSPICIOUS_ACCOUNT_PATTERN');
    riskScore += 30;
  }
  if (isBot) {
    flags.push('BOT_IDENTIFIER');
    riskScore += 40;
  }
  if (accountAgeHours < 1) {
    flags.push('BRAND_NEW_ACCOUNT');
    riskScore += 15;
  }

  riskScore = Math.min(100, riskScore);

  return {
    riskScore,
    flags,
    recommendation: riskScore >= 50 ? 'Recommend identity verification or temporary restriction.' : 'Account looks authentic.',
    details: {
      isSpam: false,
      isPhishing: false,
      isAbusive: false,
      isHateSpeech: false,
      isFakeAccount,
      isBot,
      isNSFW: false,
    },
  };
};

export const getModerationLogs = async (limit = 50) => {
  try {
    return await prisma.aIModerationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (err) {
    console.error('Error fetching AI moderation logs:', err);
    return [];
  }
};
