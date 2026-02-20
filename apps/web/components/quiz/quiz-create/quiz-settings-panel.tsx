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
          <span>Quiz Settings</span>
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
                  Time Limit
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set a time limit for quiz completion
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
                  <span className="text-sm text-muted-foreground">min</span>
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
                  Passing Score
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimum score required to pass
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
            label="Allow Reattempt"
            description="Let students retake the quiz"
            checked={allowReattempt}
            onCheckedChange={onAllowReattemptChange}
            icon={<RefreshCw className="h-5 w-5" />}
          />

          {/* Shuffle Questions */}
          <SettingToggle
            id="shuffle-questions"
            label="Shuffle Questions"
            description="Randomize question order for each attempt"
            checked={shuffleQuestions}
            onCheckedChange={onShuffleQuestionsChange}
            icon={<Shuffle className="h-5 w-5" />}
          />

          {/* Show Answers After Submit */}
          <SettingToggle
            id="show-answers"
            label="Show Answers After Submit"
            description="Display correct answers after quiz submission"
            checked={showAnswersAfterSubmit}
            onCheckedChange={onShowAnswersAfterSubmitChange}
            icon={<Eye className="h-5 w-5" />}
          />

          {/* Focus Loss Warning */}
          <SettingToggle
            id="focus-loss-warning"
            label="Focus Loss Warning"
            description="Warn students when they leave the quiz tab"
            checked={focusLossWarning}
            onCheckedChange={onFocusLossWarningChange}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
