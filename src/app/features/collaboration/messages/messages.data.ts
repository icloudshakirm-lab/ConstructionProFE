export type MessageChannel = 'Email' | 'SMS' | 'In-App' | 'WhatsApp';

export interface CommMessage {
  id: string;
  subject: string;
  preview: string;
  body: string;
  from: string;
  to: string;
  project: string;
  channel: MessageChannel;
  sentAt: string;
  read: boolean;
}

export const DEMO_MESSAGES: CommMessage[] = [
  {
    id: 'msg-1',
    subject: 'RFI #1042 — Foundation detail Grid C',
    preview: 'Please confirm revised pile cap detail before pour on Friday…',
    body: 'Please confirm revised pile cap detail before pour on Friday. Structural sketch attached in document register rev D.',
    from: 'Consultant — Structural',
    to: 'Site Engineer',
    project: 'Tower Block A',
    channel: 'Email',
    sentAt: '2026-06-03T08:20:00',
    read: false
  },
  {
    id: 'msg-2',
    subject: 'Material delay — structural steel',
    preview: 'Vendor advises 5-day slip on delivery to site. Impacts Level 5…',
    body: 'Vendor advises 5-day slip on delivery to site. Impacts Level 5 start — propose recovery by weekend shift.',
    from: 'Procurement',
    to: 'Project Manager',
    project: 'Tower Block A',
    channel: 'In-App',
    sentAt: '2026-06-02T16:45:00',
    read: true
  },
  {
    id: 'msg-3',
    subject: 'Safety briefing — night works',
    preview: 'Mandatory toolbox talk 19:00 at site cabin for all night crews.',
    body: 'Mandatory toolbox talk 19:00 at site cabin for all night crews. PPE audit follows.',
    from: 'HSE Officer',
    to: 'All site staff',
    project: 'Roadworks Package C',
    channel: 'SMS',
    sentAt: '2026-06-02T07:00:00',
    read: true
  },
  {
    id: 'msg-4',
    subject: 'Client walkthrough — Wing B ICU',
    preview: 'Client visit scheduled 12 June 10:00. Snagging list required.',
    body: 'Client visit scheduled 12 June 10:00. Snagging list required for Level 2 ICU corridor and plant room.',
    from: 'Client Representative',
    to: 'Project Manager',
    project: 'Central Hospital Wing B',
    channel: 'Email',
    sentAt: '2026-06-01T13:30:00',
    read: false
  }
];
