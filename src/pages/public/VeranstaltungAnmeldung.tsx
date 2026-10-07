import { useEffect, useMemo, useState } from 'react';
import { IconCalendarEvent, IconMapPin, IconUsers } from '@tabler/icons-react';
import { PublicShell } from '@/components/PublicShell';
import { tx } from '@/i18n';
import {
  loadPublicPagesConfig,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { useStepForm, useJourneySubmit } from '@/lib/journey';
import { createPublicPort } from '@/lib/journey/publicPort';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Bound } from '@/components/blocks/Bound';

const SLUG = 'veranstaltung-anmeldung';
const FIELDS = ['vorname', 'nachname', 'email', 'anmeldung_bestaetigung'];

function Form({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const [step, setStep] = useState(1);
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const f = useStepForm('veranstaltungsanmeldung', {
    fields: ['vorname', 'nachname', 'email', 'anmeldung_bestaetigung'],
    autoComplete: true,
    steps: { vorname: 1, nachname: 1, email: 1, anmeldung_bestaetigung: 1 },
  });
  const submit = useJourneySubmit(
    port,
    [{ key: 'anmeldung', entity: 'veranstaltungsanmeldung', form: f, primary: true }],
    { draftKey: SLUG },
  );

  const steps = [{ label: tx('Anmeldung') }, { label: tx('Prüfen') }];

  const restart = () => {
    submit.reset();
    f.reset();
    setStep(1);
  };

  return (
    <IntentWizardShell
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      back={false}
      forms={[f]}
      draftKey={SLUG}
    >
      {step === 1 && (
        <div className="space-y-5">
          <Bound form={f} name="vorname" />
          <Bound form={f} name="nachname" />
          <Bound form={f} name="email" />
          <Bound form={f} name="anmeldung_bestaetigung" />
          <StepNav
            hideBack
            onNext={() => f.validate(FIELDS)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      )}
      {step === 2 && !submit.done && (
        <SummaryStep
          forms={[f]}
          submit={submit}
          whatHappensNext={tx('Mit dem Absenden ist deine Anmeldung verbindlich eingegangen.')}
        />
      )}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[f]}
          title={tx('Anmeldung eingegangen')}
          next={[{ label: tx('Weitere Anmeldung'), onClick: restart }]}
        />
      )}
    </IntentWizardShell>
  );
}

export default function VeranstaltungAnmeldung() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }

  return (
    <PublicShell title={page.title} description={page.description} wide>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: IconCalendarEvent, tint: 'from-sky-100 to-sky-200 text-sky-700' },
            { icon: IconUsers, tint: 'from-emerald-100 to-emerald-200 text-emerald-700' },
            { icon: IconMapPin, tint: 'from-amber-100 to-amber-200 text-amber-700' },
          ].map(({ icon: Icon, tint }, i) => (
            <div
              key={i}
              className={`flex h-20 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br sm:h-28 ${tint}`}
            >
              <Icon size={36} stroke={1.5} className="shrink-0" />
            </div>
          ))}
        </div>

        <section className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">{tx('Über das Programm')}</h2>
          <p>
            {tx('Wir laden dich herzlich zu unserer Veranstaltung ein. Erlebe ein abwechslungsreiches Programm mit Vorträgen, Austausch und Zeit zum Kennenlernen.')}
          </p>
          <p>
            {tx('Trage unten deinen Namen und deine E-Mail-Adresse ein und bestätige deine Anmeldung. Danach ist dein Platz verbindlich vorgemerkt.')}
          </p>
        </section>

        <Form cfg={cfg} page={page} />
      </div>
    </PublicShell>
  );
}
