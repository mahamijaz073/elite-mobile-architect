import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { QUIZ_QUESTIONS } from '@/constants/mockData';
import AdModal from '@/components/AdModal';
import TokenModal from '@/components/TokenModal';

type Mode = 'quiz' | 'captcha';
type QuizState = 'question' | 'correct' | 'wrong';

const QUESTION_SECONDS = 15;
const CAPTCHA_LENGTH = 6;
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCaptcha(): string {
  return Array.from({ length: CAPTCHA_LENGTH }, () =>
    CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
  ).join('');
}

function shuffleQuestions() {
  return [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
}

export default function PlayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { awardTokens, onCaptchaSolved, captchaStreak } = useApp();

  const [mode, setMode] = useState<Mode>('quiz');

  // --- Quiz state ---
  const [questions] = useState(shuffleQuestions);
  const [qIndex, setQIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('question');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [showQuizAd, setShowQuizAd] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Captcha state ---
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaFeedback, setCaptchaFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showCaptchaToken, setShowCaptchaToken] = useState(false);
  const [showCaptchaAd, setShowCaptchaAd] = useState(false);

  const currentQuestion = questions[qIndex % questions.length];

  // Quiz timer
  useEffect(() => {
    if (mode !== 'quiz' || quizState !== 'question') return;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(QUESTION_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setQuizState('wrong');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIndex, mode, quizState]);

  const handleOptionSelect = async (index: number) => {
    if (quizState !== 'question') return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(index);
    const correct = index === currentQuestion.correct_option_index;
    if (correct) {
      setQuizState('correct');
      setQuizScore(prev => prev + 5);
      await awardTokens(5);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowTokenModal(true);
    } else {
      setQuizState('wrong');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextQuestion = () => {
    setQIndex(prev => prev + 1);
    setSelectedOption(null);
    setQuizState('question');
    setTimeLeft(QUESTION_SECONDS);
  };

  const handleRetryWithAd = () => {
    setShowQuizAd(true);
  };

  const handleQuizAdComplete = () => {
    setShowQuizAd(false);
    setSelectedOption(null);
    setQuizState('question');
    setTimeLeft(QUESTION_SECONDS);
  };

  // Captcha handlers
  const handleCaptchaSubmit = async () => {
    if (captchaInput.toUpperCase() !== captchaCode) {
      setCaptchaFeedback('wrong');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setCaptchaCode(generateCaptcha());
        setCaptchaInput('');
        setCaptchaFeedback('idle');
      }, 800);
      return;
    }
    setCaptchaFeedback('correct');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await onCaptchaSolved();
    setTimeout(() => {
      setCaptchaCode(generateCaptcha());
      setCaptchaInput('');
      setCaptchaFeedback('idle');
      if (result.rewardTokens > 0) {
        setShowCaptchaToken(true);
      } else if (result.showAd) {
        setShowCaptchaAd(true);
      }
    }, 600);
  };

  const timerCircumference = 2 * Math.PI * 22;
  const timerDash = timerCircumference * (timeLeft / QUESTION_SECONDS);

  const optionBg = useCallback(
    (i: number) => {
      if (quizState === 'question') return colors.secondary;
      if (i === currentQuestion.correct_option_index) return colors.success + '33';
      if (i === selectedOption && i !== currentQuestion.correct_option_index) return colors.destructive + '33';
      return colors.secondary;
    },
    [quizState, selectedOption, currentQuestion, colors]
  );

  const optionBorder = useCallback(
    (i: number) => {
      if (quizState === 'question') return colors.border;
      if (i === currentQuestion.correct_option_index) return colors.success;
      if (i === selectedOption && i !== currentQuestion.correct_option_index) return colors.destructive;
      return colors.border;
    },
    [quizState, selectedOption, currentQuestion, colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Play &amp; Win</Text>
        <View style={[styles.scoreChip, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.gold} />
          <Text style={[styles.scoreText, { color: colors.gold }]}>+{quizScore} today</Text>
        </View>
      </View>

      {/* Mode toggle */}
      <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
        {(['quiz', 'captcha'] as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[
              styles.toggleBtn,
              mode === m && { backgroundColor: colors.card, borderRadius: 10 },
            ]}
            onPress={() => setMode(m)}
          >
            <Ionicons
              name={m === 'quiz' ? 'bulb-outline' : 'shield-checkmark-outline'}
              size={16}
              color={mode === m ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.toggleText,
                { color: mode === m ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {m === 'quiz' ? 'Brain Quiz' : 'Captcha Solver'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== QUIZ MODE ===== */}
        {mode === 'quiz' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.quizTopRow}>
                <Text style={[styles.qNumLabel, { color: colors.mutedForeground }]}>
                  Q{(qIndex % questions.length) + 1} of {questions.length}
                </Text>
                {/* Circular timer */}
                <View style={styles.timerCircle}>
                  <Svg width={52} height={52}>
                    <Circle cx={26} cy={26} r={22} stroke={colors.muted} strokeWidth={5} fill="none" />
                    <Circle
                      cx={26} cy={26} r={22}
                      stroke={timeLeft <= 5 ? colors.destructive : colors.gold}
                      strokeWidth={5} fill="none"
                      strokeDasharray={`${timerCircumference} ${timerCircumference}`}
                      strokeDashoffset={timerCircumference - timerDash}
                      strokeLinecap="round"
                      rotation="-90" origin="26,26"
                    />
                  </Svg>
                  <View style={styles.timerCenter}>
                    <Text style={[styles.timerNum, { color: timeLeft <= 5 ? colors.destructive : colors.foreground }]}>
                      {timeLeft}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.questionText, { color: colors.foreground }]}>
                {currentQuestion.question}
              </Text>
            </View>

            <View style={styles.optionsGrid}>
              {currentQuestion.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionBtn,
                    { backgroundColor: optionBg(i), borderColor: optionBorder(i) },
                  ]}
                  onPress={() => handleOptionSelect(i)}
                  disabled={quizState !== 'question'}
                  activeOpacity={0.75}
                >
                  <View style={[styles.optionIndex, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.optionIndexText, { color: colors.mutedForeground }]}>
                      {['A', 'B', 'C', 'D'][i]}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{opt}</Text>
                  {quizState !== 'question' && i === currentQuestion.correct_option_index && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                  {quizState !== 'question' && i === selectedOption && i !== currentQuestion.correct_option_index && (
                    <Ionicons name="close-circle" size={20} color={colors.destructive} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {quizState === 'correct' && (
              <View style={[styles.feedbackCard, { backgroundColor: colors.success + '22', borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feedbackTitle, { color: colors.success }]}>Correct! +5 Tokens</Text>
                  <Text style={[styles.feedbackSub, { color: colors.mutedForeground }]}>Keep going!</Text>
                </View>
                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: colors.success }]}
                  onPress={nextQuestion}
                >
                  <Text style={[styles.nextBtnText, { color: '#fff' }]}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {quizState === 'wrong' && (
              <View style={[styles.feedbackCard, { backgroundColor: colors.destructive + '22', borderColor: colors.destructive }]}>
                <Ionicons name="close-circle" size={24} color={colors.destructive} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feedbackTitle, { color: colors.destructive }]}>
                    {timeLeft === 0 ? "Time's up!" : 'Wrong answer'}
                  </Text>
                  <Text style={[styles.feedbackSub, { color: colors.mutedForeground }]}>Watch an ad to retry</Text>
                </View>
                <View style={{ gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.accent }]}
                    onPress={handleRetryWithAd}
                  >
                    <MaterialCommunityIcons name="play-circle-outline" size={14} color="#fff" />
                    <Text style={[styles.nextBtnText, { color: '#fff' }]}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: colors.muted }]}
                    onPress={nextQuestion}
                  >
                    <Text style={[styles.nextBtnText, { color: colors.mutedForeground }]}>Skip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ===== CAPTCHA MODE ===== */}
        {mode === 'captcha' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.captchaHeader}>
                <View style={styles.captchaProgress}>
                  <Text style={[styles.captchaProgressLabel, { color: colors.mutedForeground }]}>
                    Progress: {captchaStreak}/{5}
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.success, width: `${(captchaStreak / 5) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
                <View style={[styles.rewardChip, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '44' }]}>
                  <Text style={[styles.rewardChipText, { color: colors.gold }]}>+20 at 5</Text>
                </View>
              </View>

              <Text style={[styles.captchaInstructions, { color: colors.mutedForeground }]}>
                Type the code exactly as shown below:
              </Text>

              {/* Distorted captcha display */}
              <View style={[styles.captchaDisplay, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                {captchaCode.split('').map((char, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.captchaChar,
                      {
                        color: i % 2 === 0 ? colors.gold : colors.accent,
                        transform: [
                          { rotate: `${(i % 3 === 0 ? -1 : 1) * (8 + (i * 3) % 12)}deg` },
                          { translateY: i % 2 === 0 ? -4 : 4 },
                        ],
                      },
                    ]}
                  >
                    {char}
                  </Text>
                ))}
                {/* Noise lines */}
                <View style={[styles.noiseLine, { top: '40%', backgroundColor: colors.mutedForeground + '55' }]} />
                <View style={[styles.noiseLine, { top: '65%', backgroundColor: colors.mutedForeground + '33' }]} />
              </View>

              <TextInput
                style={[
                  styles.captchaInput,
                  {
                    backgroundColor: colors.input,
                    borderColor:
                      captchaFeedback === 'correct'
                        ? colors.success
                        : captchaFeedback === 'wrong'
                        ? colors.destructive
                        : colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={captchaInput}
                onChangeText={v => setCaptchaInput(v.toUpperCase())}
                placeholder="Enter code here..."
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={CAPTCHA_LENGTH}
                textAlign="center"
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: captchaInput.length === CAPTCHA_LENGTH ? colors.gold : colors.muted },
                ]}
                onPress={handleCaptchaSubmit}
                disabled={captchaInput.length !== CAPTCHA_LENGTH}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.submitBtnText,
                    { color: captchaInput.length === CAPTCHA_LENGTH ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  Submit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setCaptchaCode(generateCaptcha()); setCaptchaInput(''); }}
                style={styles.refreshRow}
              >
                <Ionicons name="refresh" size={14} color={colors.mutedForeground} />
                <Text style={[styles.refreshText, { color: colors.mutedForeground }]}>New code</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="information-outline" size={18} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Solve 5 captchas to collect 20 tokens. After the 5th, a quick ad plays before returning here.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <AdModal visible={showQuizAd} onComplete={handleQuizAdComplete} onDismiss={() => setShowQuizAd(false)} />
      <AdModal
        visible={showCaptchaAd}
        onComplete={() => { setShowCaptchaAd(false); }}
        onDismiss={() => setShowCaptchaAd(false)}
      />
      <TokenModal visible={showTokenModal} tokens={5} onClose={() => setShowTokenModal(false)} />
      <TokenModal visible={showCaptchaToken} tokens={20} onClose={() => setShowCaptchaToken(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scoreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  scoreText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  toggle: {
    flexDirection: 'row', margin: 16, borderRadius: 12, padding: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
  },
  toggleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  quizTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qNumLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  timerCircle: { position: 'relative' },
  timerCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  timerNum: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  questionText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', lineHeight: 24 },
  optionsGrid: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    borderWidth: 1.5, padding: 14, gap: 12,
  },
  optionIndex: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  optionIndexText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  optionText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  feedbackCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    borderWidth: 1, padding: 14, gap: 12,
  },
  feedbackTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  feedbackSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, gap: 4,
  },
  nextBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  captchaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  captchaProgress: { flex: 1, gap: 6 },
  captchaProgressLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  rewardChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  rewardChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  captchaInstructions: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  captchaDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, borderRadius: 14, borderWidth: 1, paddingVertical: 20, paddingHorizontal: 16,
    overflow: 'hidden',
  },
  captchaChar: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  noiseLine: { position: 'absolute', left: 0, right: 0, height: 1 },
  captchaInput: {
    height: 54, borderRadius: 12, borderWidth: 1.5,
    fontSize: 20, fontFamily: 'Inter_600SemiBold', letterSpacing: 6,
  },
  submitBtn: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  refreshRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  refreshText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, flex: 1 },
});
