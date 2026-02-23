/**
 * QuizSettingsPanel Component
 * REQ-FE-630: Quiz settings collapsible panel
 *
 * Features:
 * - Collapsible panel with toggle switches
 * - Time limit (with enable toggle)
 * - Passing score (with enable toggle)
 * - Other toggles: allowReattempt, shuffleQuestions, showAnswersAfterSubmit, focusLossWarning
 */

"use client";

import { ChevronDown, ChevronUp, Clock, Target, RefreshCw, Shuffle, Eye, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

interface QuizSettingsPanelProps {
  timeLimitMinutes: number | undefined;
  onTimeLimitChange: (value: number | undefined) => void;
  passingScore: number | undefined;
  onPassingScoreChange: (value: number | undefined) => void;
  allowReattempt: boolean;
  onAllowReattemptChange: (value: boolean) => void;
  shuffleQuestions: boolean;
  onShuffleQuestionsChange: (value: boolean) => void;
  showAnswersAfterSubmit: boolean;
  onShowAnswersAfterSubmitChange: (value: boolean) => void;
  focusLossWarning: boolean;
  onFocusLossWarningChange: (value: boolean) => void;
}

interface SettingToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ReactNode;
}

function SettingToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="space-y-0.5">
          <Label htmlFor={id} className="cursor-pointer">
            {label}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

/**
 * QuizSettingsPanel - Collapsible panel for quiz settings
 */
export function QuizSettingsPanel({
  timeLimitMinutes,
  onTimeLimitChange,
  passingScore,
  onPassingScoreChange,
  allowReattempt,
  onAllowReattemptChange,
  shuffleQuestions,
  onShuffleQuestionsChange,
  showAnswersAfterSubmit,
  onShowAnswersAfterSubmitChange,
  focusLossWarning,
  onFocusLossWarningChange,
}: QuizSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [timeLimitEnabled, setTimeLimitEnabled] = useState(timeLimitMinutes !== undefined);
  const [passingScoreEnabled, setPassingScoreEnabled] = useState(passingScore !== undefined);

  const handleTimeLimitEnableChange = (enabled: boolean) => {
    setTimeLimitEnabled(enabled);
    if (!enabled) {
      onTimeLimitChange(undefined);
    } else {
      onTimeLimitChange(timeLimitMinutes ?? 30);
    }
  };

  const handlePassingScoreEnableChange = (enabled: boolean) => {
    setPassingScoreEnabled(enabled);
    if (!enabled) {
      onPassingScoreChange(undefined);
    } else {
      onPassingScoreChange(passingScore ?? 70);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-lg border">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-4 font-medium"
        >
          <span>퀴즈 설정</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-1 divide-y">
          {/* Time Limit */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="time-limit-enabled" className="cursor-pointer">
                  제한 시간
                </Label>
                <p className="text-sm text-muted-foreground">
                  퀴즈 완료 제한 시간 설정
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {timeLimitEnabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={timeLimitMinutes ?? ""}
                    onChange={(e) => {
                      onTimeLimitChange(
                        e.target.value ? parseInt(e.target.value, 10) : undefined
                      );
                    }}
                    className="w-20"
                    min={1}
                    max={300}
                  />
                  <span className="text-sm text-muted-foreground">분</span>
                </div>
              )}
              <Switch
                id="time-limit-enabled"
                checked={timeLimitEnabled}
                onCheckedChange={handleTimeLimitEnableChange}
              />
            </div>
          </div>

          {/* Passing Score */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="passing-score-enabled" className="cursor-pointer">
                  합격 점수
                </Label>
                <p className="text-sm text-muted-foreground">
                  합격에 필요한 최소 점수
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {passingScoreEnabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={passingScore ?? ""}
                    onChange={(e) => {
                      onPassingScoreChange(
                        e.target.value ? parseInt(e.target.value, 10) : undefined
                      );
                    }}
                    className="w-20"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
              <Switch
                id="passing-score-enabled"
                checked={passingScoreEnabled}
                onCheckedChange={handlePassingScoreEnableChange}
              />
            </div>
          </div>

          {/* Allow Reattempt */}
          <SettingToggle
            id="allow-reattempt"
            label="재응시 허용"
            description="학생이 퀴즈를 다시 풀 수 있도록 허용"
            checked={allowReattempt}
            onCheckedChange={onAllowReattemptChange}
            icon={<RefreshCw className="h-5 w-5" />}
          />

          {/* Shuffle Questions */}
          <SettingToggle
            id="shuffle-questions"
            label="문항 순서 섞기"
            description="응시할 때마다 문항 순서를 무작위로 변경"
            checked={shuffleQuestions}
            onCheckedChange={onShuffleQuestionsChange}
            icon={<Shuffle className="h-5 w-5" />}
          />

          {/* Show Answers After Submit */}
          <SettingToggle
            id="show-answers"
            label="제출 후 정답 공개"
            description="퀴즈 제출 후 정답을 표시"
            checked={showAnswersAfterSubmit}
            onCheckedChange={onShowAnswersAfterSubmitChange}
            icon={<Eye className="h-5 w-5" />}
          />

          {/* Focus Loss Warning */}
          <SettingToggle
            id="focus-loss-warning"
            label="포커스 이탈 경고"
            description="학생이 퀴즈 탭을 벗어나면 경고 표시"
            checked={focusLossWarning}
            onCheckedChange={onFocusLossWarningChange}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
