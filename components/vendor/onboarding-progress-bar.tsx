/**
 * Reusable onboarding progress bar component
 * Displays 6 steps: Company Information, Contact Person, Declaration, Account Preferences, Bank account, Verification
 */

interface OnboardingProgressBarProps {
  currentStep: number; // 1-6, where 1 = Company Information, 6 = Verification
}

const STEPS = [
  { id: 1, label: "Company Information" },
  { id: 2, label: "Contact Person" },
  { id: 3, label: "Declaration" },
  { id: 4, label: "Account Preferences" },
  { id: 5, label: "Bank account" },
  { id: 6, label: "Verification" },
] as const;

export function OnboardingProgressBar({ currentStep }: OnboardingProgressBarProps) {
  return (
    <div className="mb-8">
      <div className="relative">
        {/* Horizontal connecting line - hidden on mobile, visible on larger screens */}
        <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-border"></div>

        {/* Steps Container - 6 steps */}
        {/* Mobile: scrollable horizontal, Desktop: full width with spacing */}
        <div className="relative flex items-start justify-between w-full overflow-x-auto md:overflow-visible scrollbar-hide">
          {STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center shrink-0 md:flex-1 min-w-[100px] md:min-w-0"
              >
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center relative z-10 ${isCompleted || isCurrent
                      ? "bg-secondary"
                      : "bg-bg-light border-2 border-border"
                    }`}
                >
                  {isCompleted ? (
                    <span className="text-white text-sm md:text-base font-bold">✓</span>
                  ) : (
                    <span
                      className={`${isCurrent
                          ? "text-white text-sm md:text-base font-bold"
                          : "text-black text-xs md:text-sm font-bold"
                        }`}
                    >
                      {step.id}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs md:text-sm mt-1 md:mt-2 text-center leading-tight px-1 ${isCompleted || isCurrent
                      ? "font-bold text-black"
                      : "font-medium text-black"
                    }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

