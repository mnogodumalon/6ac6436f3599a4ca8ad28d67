import type { Veranstaltungsanmeldung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface VeranstaltungsanmeldungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Veranstaltungsanmeldung;
}

export function VeranstaltungsanmeldungDetails({
  record,
}: VeranstaltungsanmeldungDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('veranstaltungsanmeldung', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('veranstaltungsanmeldung', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('veranstaltungsanmeldung', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('veranstaltungsanmeldung', 'anmeldung_bestaetigung')} value={record.fields.anmeldung_bestaetigung} format="bool" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.VERANSTALTUNGSANMELDUNG} recordId={record.record_id} readOnly={!perms.canWrite('veranstaltungsanmeldung')} />
    </>
  );
}
