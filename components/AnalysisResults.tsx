import type { AnalyzeCaseResponse } from "../lib/types";
import { Card, SecondaryCard, SimpleList } from "./WardBrainCard";

export function AnalysisResults({ result }: { result: AnalyzeCaseResponse }) {
  return (
    <section className="space-y-4">
      <Card title="Features detected">
        {result.detectedFeatures.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {result.detectedFeatures.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm text-slate-700"
              >
                {feature}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">No features detected yet.</p>
        )}
      </Card>

      <Card title="Ranked differentials">
        {result.differentials.length > 0 ? (
          <ol className="space-y-2">
            {result.differentials.map((dx, index) => (
              <li key={dx.name} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold">
                    {index + 1}. {dx.name}
                  </div>
                  <div className="text-sm text-slate-500">Score {dx.score}</div>
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">Why it fits: </span>
                  {dx.reasonsFor.length > 0 ? dx.reasonsFor.join(", ") : "Limited support"}
                </div>

                {dx.reasonsAgainst.length > 0 && (
                  <div className="mt-1 text-sm text-slate-700">
                    <span className="font-medium">Why against: </span>
                    {dx.reasonsAgainst.join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-slate-600">No differential met the current display threshold.</p>
        )}
      </Card>

      <Card title="Red-flag pattern detection">
        {result.redFlags.length > 0 ? (
          <ul className="space-y-2">
            {result.redFlags.map((flag) => (
              <li key={flag.name} className="rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-red-900">{flag.name}</div>

                  {flag.sourceBody && flag.sourceId && (
                    <span className="rounded-full border border-red-300 px-2 py-0.5 text-xs font-medium text-red-900">
                      {flag.sourceBody} {flag.sourceId}
                    </span>
                  )}

                  {flag.sourceCoverage && (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                      coverage: {flag.sourceCoverage}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm text-red-800">{flag.explanation}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">No major red-flag override pattern detected yet.</p>
        )}
      </Card>

      <Card title="Does your lead diagnosis fit?">
        <div className="mb-2 text-lg font-semibold">{result.fitCheck.label}</div>
        <p className="mb-3 text-slate-700">{result.fitCheck.summary}</p>

        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Supporting: </span>
            {result.fitCheck.supporting.length > 0
              ? result.fitCheck.supporting.join(", ")
              : "None identified"}
          </div>
          <div>
            <span className="font-medium">Conflicting: </span>
            {result.fitCheck.conflicting.length > 0
              ? result.fitCheck.conflicting.join(", ")
              : "No major conflicts detected"}
          </div>
        </div>
      </Card>

      <Card title="Dangerous diagnoses to exclude / comparison">
        <div className="space-y-3 text-sm text-slate-700">
          <p>{result.reasoningComparison.leadAssessment}</p>
          <p>{result.reasoningComparison.differentialAssessment}</p>
          <p>{result.reasoningComparison.dangerAssessment}</p>
        </div>
      </Card>

      <Card title="Anchor warning">
        <p>{result.anchorWarning}</p>
      </Card>

      <Card title="Present to the reg">
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <span className="font-medium">Problem representation: </span>
          {result.problemRepresentation}
        </div>
        <p>{result.presentation}</p>
      </Card>

      {result.nextSteps && (
        <Card title="Investigations and immediate next steps">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-slate-900">{result.nextSteps.diagnosis}</div>

            {result.nextSteps.sourceBody && result.nextSteps.sourceId && (
              <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-800">
                {result.nextSteps.sourceBody} {result.nextSteps.sourceId}
              </span>
            )}

            {result.nextSteps.sourceCoverage && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                coverage: {result.nextSteps.sourceCoverage}
              </span>
            )}
          </div>

          {result.nextSteps.investigations.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium text-slate-900">Investigations</div>
              <ul className="space-y-1 text-sm text-slate-700">
                {result.nextSteps.investigations.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {result.nextSteps.immediateNextSteps.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium text-slate-900">Immediate next steps</div>
              <ul className="space-y-1 text-sm text-slate-700">
                {result.nextSteps.immediateNextSteps.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {result.nextSteps.notes.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {result.nextSteps.notes.join(" ")}
            </div>
          )}
        </Card>
      )}

      <SecondaryCard title="Presentation teaching scaffold">
        {result.matchedPresentationBlock ? (
          <details>
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-700">
              Show the broader presentation framework WardBrain thinks this case belongs to
            </summary>
            <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
              <p className="text-sm text-slate-600">
                A presentation-based teaching framework relevant to this case. This is a
                secondary educational scaffold, not the main case-specific reasoning output.
              </p>

              <div>
                <div className="text-sm font-medium text-slate-500">Presentation</div>
                <div className="text-lg font-semibold text-slate-900">
                  {result.matchedPresentationBlock.block.presentation}
                </div>
              </div>

              {result.matchedPresentationBlock.emphasis && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="text-sm font-medium text-amber-900">
                    {result.matchedPresentationBlock.emphasis.title}
                  </div>
                  <p className="mt-1 text-sm text-amber-900">
                    {result.matchedPresentationBlock.emphasis.summary}
                  </p>
                  <SimpleList
                    title="Case-relevant emphasis"
                    items={result.matchedPresentationBlock.emphasis.highlightedDifferentials}
                  />
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-slate-500">Lead pattern</div>
                <p className="text-slate-700">{result.matchedPresentationBlock.block.leadPattern}</p>
              </div>

              <SimpleList
                title="Ranked differentials"
                items={result.matchedPresentationBlock.block.differentials}
                ordered
              />
              <SimpleList
                title="Features for the lead"
                items={result.matchedPresentationBlock.block.featuresForLead}
              />
              <SimpleList
                title="Features against the lead"
                items={result.matchedPresentationBlock.block.featuresAgainstLead}
              />
              <SimpleList
                title="Worst-case diagnoses to exclude"
                items={result.matchedPresentationBlock.block.worstCaseToExclude}
              />
              <SimpleList
                title="Red-flag override triggers"
                items={result.matchedPresentationBlock.block.redFlags}
              />
              <SimpleList
                title="First-line tests"
                items={result.matchedPresentationBlock.block.firstLineTests}
              />
              <SimpleList
                title="Immediate actions"
                items={result.matchedPresentationBlock.block.immediateActions}
              />

              <div>
                <div className="text-sm font-medium text-slate-500">Escalation</div>
                <p className="text-slate-700">{result.matchedPresentationBlock.block.escalation}</p>
              </div>
            </div>
          </details>
        ) : (
          <p className="text-sm text-slate-600">
            No closely matching presentation teaching scaffold is available for this case yet.
          </p>
        )}
      </SecondaryCard>
    </section>
  );
}
